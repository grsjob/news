import { Request, Response } from "express";
import { colorizedConsole } from "@/helpers/console";
import { CoreServiceClass } from "@/services/core-service";

class CoreController {
  async initialize(req: Request, res: Response): Promise<void> {
    try {
      const { llmApiKey, llmModel } = req.body;

      if (!llmApiKey || !llmModel) {
        res.status(400).json({ error: "LLM API key and model are required" });
        return;
      }

      const config = {
        llm: {
          apiKey: llmApiKey,
          model: llmModel,
          baseUrl: req.body.llmBaseUrl,
          maxTokens: req.body.maxTokens,
          temperature: req.body.temperature,
        },
        sources: {
          defaultLimit: req.body.defaultLimit || 10,
        },
      };

      await CoreServiceClass.initialize(config);
      res.status(200).json({ message: "Core initialized successfully" });
    } catch (error) {
      colorizedConsole.err(`Error initializing core: ${error}`);
      res.status(500).json({ error: "Failed to initialize core" });
    }
  }

  async processNews(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;
      const results = await CoreServiceClass.processNews(limit);
      res.status(200).json({ results });
    } catch (error) {
      colorizedConsole.err(`Error processing news: ${error}`);
      res.status(500).json({ error: "Failed to process news" });
    }
  }

  async processNewsFromSource(req: Request, res: Response): Promise<void> {
    try {
      const { sourceName } = req.params;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;

      if (!sourceName) {
        res.status(400).json({ error: "Source name is required" });
        return;
      }

      const results = await CoreServiceClass.processNewsFromSource(
        sourceName,
        limit
      );
      res.status(200).json({ results });
    } catch (error) {
      colorizedConsole.err(`Error processing news from source: ${error}`);
      res.status(500).json({ error: "Failed to process news from source" });
    }
  }

  async getResults(req: Request, res: Response): Promise<void> {
    try {
      const results = CoreServiceClass.getResults();
      res.status(200).json({ results });
    } catch (error) {
      colorizedConsole.err(`Error getting results: ${error}`);
      res.status(500).json({ error: "Failed to get results" });
    }
  }

  async clearResults(req: Request, res: Response): Promise<void> {
    try {
      CoreServiceClass.clearResults();
      res.status(200).json({ message: "Results cleared successfully" });
    } catch (error) {
      colorizedConsole.err(`Error clearing results: ${error}`);
      res.status(500).json({ error: "Failed to clear results" });
    }
  }

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = CoreServiceClass.getStatistics();
      res.status(200).json({ statistics });
    } catch (error) {
      colorizedConsole.err(`Error getting statistics: ${error}`);
      res.status(500).json({ error: "Failed to get statistics" });
    }
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const health = await CoreServiceClass.healthCheck();
      res.status(200).json({ health });
    } catch (error) {
      colorizedConsole.err(`Error during health check: ${error}`);
      res.status(500).json({ error: "Health check failed" });
    }
  }
}

export const CoreControllerClass = new CoreController();
