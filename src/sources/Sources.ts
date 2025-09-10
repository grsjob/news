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

  public async fetchAllArticles(limit?: number): Promise<IArticle[]> {
    if (!this.initialized) {
      throw new Error("Sources not initialized");
    }

    const allArticles: IArticle[] = [];
    const fetchPromises: Promise<void>[] = [];

    colorizedConsole.accept(
      `Fetching articles from ${this.sources.size} sources...`,
    );

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
                  const articlesWithSource = articles.map((article) => ({
                    ...article,
                    source: sourceName,
                  }));
                  allArticles.push(...articlesWithSource);
                } else {
                  allArticles.push({
                    ...articles,
                    source: sourceName,
                  });
                }
              } catch (parseError) {
                colorizedConsole.err(
                  `Error parsing articles from ${sourceName}: ${parseError}`,
                );
              }
            }
          } catch (error) {
            colorizedConsole.err(
              `Error fetching articles from ${sourceName}: ${error}`,
            );
          }
        })(),
      );
    }

    await Promise.all(fetchPromises);

    colorizedConsole.accept(
      `Successfully fetched ${allArticles.length} articles from all sources`,
    );
    return allArticles;
  }
}
