import { IArticle } from "@/sources/types";

export interface ILLMProcessor {
  processArticles(articles: IArticle[]): Promise<ILLMResult[]>;
  getProcessedResults(): ILLMResult[];
  clearResults(): void;
}

export interface ILLMResult {
  id: string;
  articleId: string;
  source: string;
  title: string;
  summary: string;
  memes: string[];
  jokes: string[];
  processedAt: Date;
}

export interface IOpenRouterConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ILLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
export { IArticle };
