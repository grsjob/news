/** @format */

import { colorizedConsole } from "@/helpers/console";
import {
  INotificationService,
  INotificationConfig,
  INotificationGroupConfig,
  INotificationGroup,
} from "./types";
import { ILLMResult } from "@/services/llm";
import { Telegraf } from "telegraf";

class SingleNotificationService implements INotificationService {
  private config: INotificationConfig;
  private telegramBot: Telegraf | null = null;
  private groupId: string;

  constructor(config: INotificationConfig, groupId: string) {
    this.config = config;
    this.groupId = groupId;

    if (this.config.telegram?.botToken) {
      this.telegramBot = new Telegraf(this.config.telegram.botToken);
    }
  }

  public async sendNotification(message: string): Promise<void> {
    if (!this.config.enabled) {
      colorizedConsole.warn(
        `Notifications are disabled for group ${this.groupId}`
      );
      return;
    }

    try {
      const sendPromises: Promise<void>[] = [];

      if (this.config.email) {
        sendPromises.push(this.sendEmail(message));
      }

      if (this.config.telegram && this.telegramBot) {
        sendPromises.push(this.sendTelegramMessage(message));
      }

      if (sendPromises.length === 0) {
        colorizedConsole.warn(
          `No notification channels configured for group ${this.groupId}`
        );
        return;
      }

      await Promise.all(sendPromises);
      colorizedConsole.accept(
        `Notification sent successfully for group ${this.groupId}`
      );
    } catch (error) {
      colorizedConsole.err(
        `Failed to send notification for group ${this.groupId}: ${error}`
      );
      throw error;
    }
  }

  public async sendResults(results: ILLMResult[]): Promise<void> {
    if (!results.length) {
      colorizedConsole.warn(`No results to send for group ${this.groupId}`);
      return;
    }

    const message = this.formatResultsMessage(results);
    await this.sendNotification(message);
  }

  private formatResultsMessage(results: ILLMResult[]): string {
    const header = `📰 Обработано новостей: ${results.length}\n\n`;

    const resultsText = results
      .map((result, index) => {
        return `
📄 Статья ${index + 1}:
🔗 Источник: ${result.source}
📌 Заголовок: ${result.title}
🌐 URL: ${result.url}
📝 Краткое содержание: ${result.summary}

😄 Мемы и шутки:
${result.memes.map((meme: string) => `  • ${meme}`).join("\n")}
${result.jokes.map((joke: string) => `  • ${joke}`).join("\n")}

---
        `.trim();
      })
      .join("\n\n");

    const footer = `\n⏰ Обработано: ${new Date().toLocaleString("ru-RU")}`;

    return header + resultsText + footer;
  }

  private async sendEmail(message: string): Promise<void> {
    if (!this.config.email) {
      return;
    }

    try {
      // Здесь должна быть логика отправки email
      // Для примера просто выводим в консоль
      colorizedConsole.accept(
        `Email would be sent to: ${this.config.email.to.join(", ")}`
      );
      colorizedConsole.accept(`Email content: ${message.substring(0, 100)}...`);
    } catch (error) {
      colorizedConsole.err(
        `Failed to send email for group ${this.groupId}: ${error}`
      );
      throw error;
    }
  }

  private async sendTelegramMessage(message: string): Promise<void> {
    if (!this.telegramBot || !this.config.telegram?.chatId) {
      return;
    }

    try {
      const maxLength = 4096;
      if (message.length <= maxLength) {
        await this.telegramBot.telegram.sendMessage(
          this.config.telegram.chatId,
          message
        );
      } else {
        const parts = [];
        let currentPart = "";

        const lines = message.split("\n");
        for (const line of lines) {
          if (currentPart.length + line.length + 1 > maxLength) {
            if (currentPart) {
              parts.push(currentPart);
              currentPart = line + "\n";
            } else {
              const chunks = line.match(
                new RegExp(`.{1,${maxLength}}`, "g")
              ) || [line];
              parts.push(...chunks);
              currentPart = "";
            }
          } else {
            currentPart += line + "\n";
          }
        }

        if (currentPart) {
          parts.push(currentPart);
        }

        for (let i = 0; i < parts.length; i++) {
          const partMessage = parts[i];
          const partHeader =
            parts.length > 1 ? `[Часть ${i + 1}/${parts.length}]\n` : "";
          await this.telegramBot.telegram.sendMessage(
            this.config.telegram.chatId,
            partHeader + partMessage
          );
        }
      }

      colorizedConsole.accept(
        `Telegram message sent successfully for group ${this.groupId}`
      );
    } catch (error) {
      colorizedConsole.err(
        `Failed to send Telegram message for group ${this.groupId}: ${error}`
      );
      throw error;
    }
  }

  public updateConfig(config: Partial<INotificationConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.telegram?.botToken) {
      this.telegramBot = new Telegraf(config.telegram.botToken);
    }

    colorizedConsole.accept(
      `Notification config updated for group ${this.groupId}`
    );
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public getGroupId(): string {
    return this.groupId;
  }
}

export class NotificationService implements INotificationService {
  private notificationGroups: Map<string, SingleNotificationService> =
    new Map();
  private config: INotificationGroupConfig;
  private defaultGroupId?: string;

  constructor(config: INotificationGroupConfig) {
    this.config = config;
    this.defaultGroupId = config.defaultGroupId;
    this.initializeNotificationGroups();
  }

  private initializeNotificationGroups(): void {
    try {
      for (const group of this.config.groups) {
        const notificationService = new SingleNotificationService(
          group.config,
          group.id
        );
        this.notificationGroups.set(group.id, notificationService);
      }
      colorizedConsole.accept(
        `Initialized ${this.notificationGroups.size} notification groups`
      );
    } catch (error) {
      colorizedConsole.err(`Error initializing notification groups: ${error}`);
      throw error;
    }
  }

  public async sendNotification(message: string): Promise<void> {
    if (this.notificationGroups.size === 0) {
      colorizedConsole.warn("No notification groups configured");
      return;
    }

    const sendPromises: Promise<void>[] = [];

    for (const [groupId, service] of this.notificationGroups) {
      if (service.isEnabled()) {
        sendPromises.push(service.sendNotification(message));
      }
    }

    if (sendPromises.length === 0) {
      colorizedConsole.warn("No enabled notification groups found");
      return;
    }

    await Promise.all(sendPromises);
    colorizedConsole.accept("Notifications sent to all enabled groups");
  }

  public async sendResults(results: ILLMResult[]): Promise<void> {
    if (!results.length) {
      colorizedConsole.warn("No results to send");
      return;
    }

    const message = this.formatResultsMessage(results);
    await this.sendNotification(message);
  }

  public async sendResultsToGroup(
    groupId: string,
    results: ILLMResult[]
  ): Promise<void> {
    const service = this.notificationGroups.get(groupId);

    if (!service) {
      colorizedConsole.err(`Notification group ${groupId} not found`);
      return;
    }

    if (!service.isEnabled()) {
      colorizedConsole.warn(`Notification group ${groupId} is disabled`);
      return;
    }

    await service.sendResults(results);
  }

  private formatResultsMessage(results: ILLMResult[]): string {
    const header = `📰 Обработано новостей: ${results.length}\n\n`;

    const resultsText = results
      .map((result, index) => {
        return `
📄 Статья ${index + 1}:
🔗 Источник: ${result.source}
📌 Заголовок: ${result.title}
🌐 URL: ${result.url}
📝 Краткое содержание: ${result.summary}

😄 Мемы и шутки:
${result.memes.map((meme: string) => `  • ${meme}`).join("\n")}
${result.jokes.map((joke: string) => `  • ${joke}`).join("\n")}

---
        `.trim();
      })
      .join("\n\n");

    const footer = `\n⏰ Обработано: ${new Date().toLocaleString("ru-RU")}`;

    return header + resultsText + footer;
  }

  public getNotificationGroups(): INotificationGroup[] {
    return this.config.groups;
  }

  public getNotificationService(
    groupId: string
  ): SingleNotificationService | undefined {
    return this.notificationGroups.get(groupId);
  }

  public getDefaultNotificationService():
    | SingleNotificationService
    | undefined {
    if (this.defaultGroupId) {
      return this.notificationGroups.get(this.defaultGroupId);
    }
    return undefined;
  }

  public updateGroupConfig(
    groupId: string,
    config: Partial<INotificationConfig>
  ): void {
    const service = this.notificationGroups.get(groupId);
    if (service) {
      service.updateConfig(config);

      const group = this.config.groups.find((g) => g.id === groupId);
      if (group) {
        group.config = { ...group.config, ...config };
      }
    }
  }

  public isEnabled(): boolean {
    return Array.from(this.notificationGroups.values()).some((service) =>
      service.isEnabled()
    );
  }
}
