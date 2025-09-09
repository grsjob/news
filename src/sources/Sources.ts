import { ISource, IArticle } from "@/sources/types";
import { BaseSource } from "@/sources/BaseSource";
import { DvpToSource } from "@/sources/DvpToSource";
import { colorizedConsole } from "@/helpers/console";

export class Sources {
  private sources: Map<string, ISource> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initializeSources();
  }

  private initializeSources(): void {
    try {
      const dvpSource = new DvpToSource();
      this.sources.set(dvpSource.name, dvpSource);
      
      this.initialized = true;
      colorizedConsole.accept(`Initialized ${this.sources.size} news sources`);
    } catch (error) {
      colorizedConsole.err(`Error initializing sources: ${error}`);
      throw error;
    }
  }

  public getSources(): ISource[] {
    return Array.from(this.sources.values());
  }

  public getSource(name: string): ISource | undefined {
    return this.sources.get(name);
  }

 
  public async fetchAllArticles(limit?: number): Promise<IArticle[]> {
    if (!this.initialized) {
      throw new Error("Sources not initialized");
    }

    const allArticles: IArticle[] = [];
    const fetchPromises: Promise<void>[] = [];

    colorizedConsole.accept(`Fetching articles from ${this.sources.size} sources...`);

    for (const [sourceName, source] of this.sources) {
      fetchPromises.push(
        (async () => {
          try {
            colorizedConsole.accept(`Fetching articles from ${sourceName}...`);
            const articlesData = await source.fetchArticles(limit);
            
            if (articlesData) {
              try {
                const articles = JSON.parse(articlesData);
                if (Array.isArray(articles)) {
                  const articlesWithSource = articles.map(article => ({
                    ...article,
                    source: sourceName
                  }));
                  allArticles.push(...articlesWithSource);
                } else {
                  allArticles.push({
                    ...articles,
                    source: sourceName
                  });
                }
              } catch (parseError) {
                colorizedConsole.err(`Error parsing articles from ${sourceName}: ${parseError}`);
              }
            }
          } catch (error) {
            colorizedConsole.err(`Error fetching articles from ${sourceName}: ${error}`);
          }
        })()
      );
    }

    await Promise.all(fetchPromises);
    
    colorizedConsole.accept(`Successfully fetched ${allArticles.length} articles from all sources`);
    return allArticles;
  }

  public async fetchArticlesFromSource(sourceName: string, limit?: number): Promise<IArticle[]> {
    const source = this.sources.get(sourceName);
    if (!source) {
      throw new Error(`Source ${sourceName} not found`);
    }

    try {
      colorizedConsole.accept(`Fetching articles from ${sourceName}...`);
      const articlesData = await source.fetchArticles(limit);
      
      if (articlesData) {
        try {
          const articles = JSON.parse(articlesData);
          if (Array.isArray(articles)) {
            return articles.map(article => ({
              ...article,
              source: sourceName
            }));
          } else {
            return [{
              ...articles,
              source: sourceName
            }];
          }
        } catch (parseError) {
          colorizedConsole.err(`Error parsing articles from ${sourceName}: ${parseError}`);
          return [];
        }
      }
      return [];
    } catch (error) {
      colorizedConsole.err(`Error fetching articles from ${sourceName}: ${error}`);
      throw error;
    }
  }

  public prepareForLLM(articles: IArticle[]): string {
    if (!articles.length) {
      return "No articles available for processing.";
    }

    const formattedArticles = articles.map((article, index) => {
      return `
Article ${index + 1}:
Source: ${article.source}
Title: ${article.title}
URL: ${article.url}
Published: ${article.publishedAt}
Content: ${article.content}
${article.tags ? `Tags: ${article.tags.join(', ')}` : ''}
---
      `.trim();
    }).join('\n\n');

    return `Here are the latest news articles for processing:\n\n${formattedArticles}`;
  }

  public async getNewsForLLM(limit?: number): Promise<string> {
    const articles = await this.fetchAllArticles(limit);
    return this.prepareForLLM(articles);
  }
}