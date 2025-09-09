import { colorizedConsole } from "@/helpers/console";
import { Sources } from "@/sources/Sources";
import { LLMProcessor } from "@/services/llm";
import { ICore, ICoreConfig, INotificationService } from "./types";
import { ILLMResult, IArticle } from "@/services/llm";

export class Core implements ICore {
  private sources: Sources;
  private llmProcessor: LLMProcessor;
  private notificationService?: INotificationService;
  private config: ICoreConfig;
  private initialized: boolean = false;

  constructor(config: ICoreConfig) {
    this.config = config;
    this.sources = new Sources();
    this.llmProcessor = new LLMProcessor(config.llm);
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

      colorizedConsole.accept("Core initialized successfully");
      this.initialized = true;
    } catch (error) {
      colorizedConsole.err(`Failed to initialize Core: ${error}`);
      throw error;
    }
  }

  public async fetchAndProcessNews(limit?: number): Promise<ILLMResult[]> {
    if (!this.initialized) {
      throw new Error("Core is not initialized");
    }

    try {
      colorizedConsole.accept("Starting news processing...");

      const articles = await this.sources.fetchAllArticles(
        limit || this.config.sources?.defaultLimit
      );

      if (!articles.length) {
        colorizedConsole.warn("No articles found to process");
        return [];
      }

      colorizedConsole.accept(
        `Fetched ${articles.length} articles from sources`
      );

      const processedResults =
        await this.llmProcessor.processArticles(articles);

      colorizedConsole.accept(
        `Successfully processed ${processedResults.length} articles`
      );

      if (this.notificationService) {
        try {
          await this.notificationService.sendResults(processedResults);
          colorizedConsole.accept("Notifications sent successfully");
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

  public async fetchAndProcessNewsFromSource(
    sourceName: string,
    limit?: number
  ): Promise<ILLMResult[]> {
    if (!this.initialized) {
      throw new Error("Core is not initialized");
    }

    try {
      colorizedConsole.accept(
        `Starting news processing from source: ${sourceName}...`
      );

      const articles = await this.sources.fetchArticlesFromSource(
        sourceName,
        limit
      );

      if (!articles.length) {
        colorizedConsole.warn(`No articles found from source: ${sourceName}`);
        return [];
      }

      colorizedConsole.accept(
        `Fetched ${articles.length} articles from ${sourceName}`
      );

      const processedResults =
        await this.llmProcessor.processArticles(articles);

      colorizedConsole.accept(
        `Successfully processed ${processedResults.length} articles from ${sourceName}`
      );

      return processedResults;
    } catch (error) {
      colorizedConsole.err(`Error in fetchAndProcessNewsFromSource: ${error}`);
      throw error;
    }
  }

  public getProcessedResults(): ILLMResult[] {
    return this.llmProcessor.getProcessedResults();
  }

  public clearResults(): void {
    this.llmProcessor.clearResults();
  }

  public getSources(): Sources {
    return this.sources;
  }

  public getLLMProcessor(): LLMProcessor {
    return this.llmProcessor;
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

  public async healthCheck(): Promise<{
    healthy: boolean;
    sources: boolean;
    llm: boolean;
    details: string[];
  }> {
    const details: string[] = [];
    let sourcesHealthy = true;
    let llmHealthy = true;

    try {
      const sources = this.sources.getSources();
      if (!sources.length) {
        sourcesHealthy = false;
        details.push("No sources configured");
      } else {
        details.push(`${sources.length} sources configured`);
      }
    } catch (error) {
      sourcesHealthy = false;
      details.push(`Sources check failed: ${error}`);
    }

    try {
      if (!this.config.llm.apiKey || !this.config.llm.model) {
        llmHealthy = false;
        details.push("LLM configuration incomplete");
      } else {
        details.push("LLM configuration complete");
      }
    } catch (error) {
      llmHealthy = false;
      details.push(`LLM check failed: ${error}`);
    }

    const overallHealthy = this.initialized && sourcesHealthy && llmHealthy;

    return {
      healthy: overallHealthy,
      sources: sourcesHealthy,
      llm: llmHealthy,
      details,
    };
  }
}
