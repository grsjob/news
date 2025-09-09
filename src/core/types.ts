import { Sources } from "@/sources/Sources";
import { LLMProcessor, ILLMResult, IOpenRouterConfig } from "@/services/llm";
import { IArticle } from "@/sources/types";

export interface ICore {
  initialize(): Promise<void>;
  fetchAndProcessNews(limit?: number): Promise<ILLMResult[]>;
  getProcessedResults(): ILLMResult[];
  clearResults(): void;
  getSources(): Sources;
  getLLMProcessor(): LLMProcessor;
}

export interface ICoreConfig {
  llm: IOpenRouterConfig;
  sources?: {
    defaultLimit?: number;
  };
}

export interface INotificationService {
  sendNotification(message: string): Promise<void>;
  sendResults(results: ILLMResult[]): Promise<void>;
}
