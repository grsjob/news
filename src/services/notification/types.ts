/** @format */

import { ILLMResult } from "@/services/llm";

export interface INotificationService {
  sendNotification(message: string): Promise<void>;
  sendResults(results: ILLMResult[]): Promise<void>;
}

export interface IEmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
  };
  from: string;
  to: string[];
}

export interface ITelegramConfig {
  botToken: string;
  chatId: string;
}

export interface INotificationConfig {
  email?: IEmailConfig;
  telegram?: ITelegramConfig;
  enabled: boolean;
}
