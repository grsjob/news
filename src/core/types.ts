/** @format */

import { ILLMResult, ICloudRuConfig as ILLMConfig } from "@/services/llm";
import { ISourceGroupConfig } from "@/sources/types";
import { INotificationGroupConfig } from "@/services/notification";

export interface ICore {
  initialize(): Promise<void>;
  fetchAndProcessNews(limit?: number): Promise<ILLMResult[]>;
  fetchAndProcessNewsByGroup(
    groupId: string,
    limit?: number
  ): Promise<ILLMResult[]>;
}

export interface ICoreConfig {
  llm: ILLMConfig;
  sources?: ISourceGroupConfig;
  notifications?: INotificationGroupConfig;
}

export interface INotificationService {
  sendNotification(message: string): Promise<void>;
  sendResults(results: ILLMResult[]): Promise<void>;
}
