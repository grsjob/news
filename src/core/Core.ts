/** @format */

import { colorizedConsole } from "@/helpers/console";
import { Sources } from "@/sources/Sources";
import { LLMProcessor } from "@/services/llm";
import { ICore, ICoreConfig, INotificationService } from "./types";
import { ILLMResult, IArticle } from "@/services/llm";
import { ArticlesDB } from "@/db/articles.db";

export class Core implements ICore {
  private sources: Sources;
  private llmProcessor: LLMProcessor;
  private notificationService?: INotificationService;
  private config: ICoreConfig;
  private initialized: boolean = false;
  private articlesDB: ArticlesDB;

  constructor(config: ICoreConfig) {
    this.config = config;
    this.sources = new Sources();
    this.llmProcessor = new LLMProcessor(config.llm);
    this.articlesDB = new ArticlesDB();
  }

  public async initialize(): Promise<void> {
    try {
      colorizedConsole.accept("Initializing Core...");

      if (!this.config.llm.apiKey) {
        throw new Error("LLM API key is required");
      }

      if (!this.config.llm.model) {
        throw new Error("LLM model is required");
      }

      await this.articlesDB.initializeTable();

      await this.cleanupOldArticles();

      await this._fetchAndProcessNewsInternal();

      colorizedConsole.accept("Core initialized successfully");
      this.initialized = true;
    } catch (error) {
      colorizedConsole.err(`Failed to initialize Core: ${error}`);
      throw error;
    }
  }

  public async cleanupOldArticles(days: number = 7): Promise<number> {
    try {
      const deletedCount = await this.articlesDB.deleteOldArticles(days);
      colorizedConsole.accept(`Cleaned up ${deletedCount} old articles`);
      return deletedCount;
    } catch (error) {
      colorizedConsole.err(`Error cleaning up old articles: ${error}`);
      throw error;
    }
  }

  public async fetchAndProcessNews(limit?: number): Promise<ILLMResult[]> {
    if (!this.initialized) {
      throw new Error("Core is not initialized");
    }

    return this._fetchAndProcessNewsInternal(limit);
  }

  private async _fetchAndProcessNewsInternal(
    limit?: number
  ): Promise<ILLMResult[]> {
    try {
      colorizedConsole.accept("Starting news processing...");

      const articles = await this.sources.fetchAllArticles(
        limit || this.config.sources?.defaultLimit
      );

      if (!articles.length) {
        colorizedConsole.warn("No articles found to process");
        return [];
      }

      const articlesWithTitle = await this.generateMissingTitles(articles);

      const uniqueArticles: IArticle[] = [];
      for (const article of articlesWithTitle) {
        const exists = await this.articlesDB.articleExistsByUrl(article.url);
        if (!exists) {
          await this.articlesDB.saveArticle(article);
          uniqueArticles.push(article);
        } else {
          colorizedConsole.warn(`Skipping duplicate article: ${article.title}`);
        }
      }

      if (!uniqueArticles.length) {
        colorizedConsole.warn("No new articles to process after deduplication");
        return [];
      }

      colorizedConsole.accept(
        `Fetched ${articles.length} articles, ${uniqueArticles.length} are unique`
      );

      const processedResults =
        await this.llmProcessor.processArticles(articlesWithTitle);

      colorizedConsole.accept(
        `Successfully processed ${processedResults.length} articles`
      );

      if (this.notificationService && processedResults.length > 0) {
        try {
          await this.notificationService.sendResults(processedResults);

          for (const result of processedResults) {
            await this.articlesDB.markArticleAsSent(result.url);
          }

          colorizedConsole.accept(
            "Notifications sent successfully and articles marked as sent"
          );
        } catch (notificationError) {
          colorizedConsole.err(
            `Failed to send notifications: ${notificationError}`
          );
        }
      }

      return processedResults;
    } catch (error) {
      colorizedConsole.err(`Error in fetchAndProcessNews: ${error}`);
      throw error;
    }
  }

  private async generateMissingTitles(
    articles: IArticle[]
  ): Promise<IArticle[]> {
    const articlesWithTitle: IArticle[] = [];

    for (const article of articles) {
      if (!article.title || article.title.trim() === "") {
        try {
          colorizedConsole.accept(
            `Generating title for article from ${article.source}`
          );
          const generatedTitle = await this.llmProcessor.generateTitle(article);
          articlesWithTitle.push({
            ...article,
            title: generatedTitle,
          });
        } catch (error) {
          colorizedConsole.err(`Error generating title for article: ${error}`);
          articlesWithTitle.push({
            ...article,
            title: `Telegram Post from ${new Date(article.publishedAt).toLocaleDateString()}`,
          });
        }
      } else {
        articlesWithTitle.push(article);
      }
    }

    return articlesWithTitle;
  }

  public setNotificationService(
    notificationService: INotificationService
  ): void {
    this.notificationService = notificationService;
    colorizedConsole.accept("Notification service set");
  }

  public getStatistics(): {
    totalArticlesProcessed: number;
    sourcesCount: number;
    isInitialized: boolean;
  } {
    return {
      totalArticlesProcessed: this.llmProcessor.getResultsCount(),
      sourcesCount: this.sources.getSources().length,
      isInitialized: this.initialized,
    };
  }
}
