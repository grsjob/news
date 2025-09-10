/** @format */

import { ILLMResult, ICloudRuConfig as ILLMConfig } from "@/services/llm";

export interface ICore {
  initialize(): Promise<void>;
  fetchAndProcessNews(limit?: number): Promise<ILLMResult[]>;
}

export interface ICoreConfig {
  llm: ILLMConfig;
  sources?: {
    defaultLimit?: number;
  };
}

export interface INotificationService {
  sendNotification(message: string): Promise<void>;
  sendResults(results: ILLMResult[]): Promise<void>;
}
