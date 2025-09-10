/** @format */

import { IArticle } from "@/sources/types";

export interface ILLMProcessor {
  processArticles(articles: IArticle[]): Promise<ILLMResult[]>;
}

export interface ILLMResult {
  id: string;
  articleId: string;
  source: string;
  title: string;
  url: string;
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

export interface ICloudRuConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  maxTokens?: number;
  temperature?: number;
  presencePenalty?: number;
  topP?: number;
}

export interface ILLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
export { IArticle };
