import { colorizedConsole } from "@/helpers/console";
import { Core, ICoreConfig } from "@/core";

class CoreService {
  private core: Core | null = null;

  async initialize(config: ICoreConfig): Promise<void> {
    try {
      this.core = new Core(config);
      await this.core.initialize();
      colorizedConsole.accept("Core service initialized successfully");
    } catch (error) {
      colorizedConsole.err(`Failed to initialize core service: ${error}`);
      throw error;
    }
  }

  async processNews(limit?: number): Promise<any[]> {
    if (!this.core) {
      throw new Error("Core service not initialized");
    }

    try {
      const results = await this.core.fetchAndProcessNews(limit);
      colorizedConsole.accept(`Processed ${results.length} articles`);
      return results;
    } catch (error) {
      colorizedConsole.err(`Error processing news: ${error}`);
      throw error;
    }
  }

  async processNewsFromSource(
    sourceName: string,
    limit?: number
  ): Promise<any[]> {
    if (!this.core) {
      throw new Error("Core service not initialized");
    }

    try {
      const results = await this.core.fetchAndProcessNewsFromSource(
        sourceName,
        limit
      );
      colorizedConsole.accept(
        `Processed ${results.length} articles from ${sourceName}`
      );
      return results;
    } catch (error) {
      colorizedConsole.err(
        `Error processing news from source ${sourceName}: ${error}`
      );
      throw error;
    }
  }

  getResults(): any[] {
    if (!this.core) {
      throw new Error("Core service not initialized");
    }
    return this.core.getProcessedResults();
  }

  clearResults(): void {
    if (!this.core) {
      throw new Error("Core service not initialized");
    }
    this.core.clearResults();
    colorizedConsole.accept("Results cleared");
  }

  getStatistics(): any {
    if (!this.core) {
      throw new Error("Core service not initialized");
    }
    return this.core.getStatistics();
  }

  async healthCheck(): Promise<any> {
    if (!this.core) {
      return {
        healthy: false,
        details: ["Core service not initialized"],
      };
    }

    try {
      return await this.core.healthCheck();
    } catch (error) {
      colorizedConsole.err(`Health check failed: ${error}`);
      return {
        healthy: false,
        details: [`Health check failed: ${error}`],
      };
    }
  }
}

export const CoreServiceClass = new CoreService();
