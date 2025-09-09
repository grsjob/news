/** @format */

import { colorizedConsole } from "@/helpers/console";
import { INotificationService, INotificationConfig } from "./types";
import { ILLMResult } from "@/services/llm";
import { Telegraf } from "telegraf";

export class NotificationService implements INotificationService {
  private config: INotificationConfig;
  private telegramBot: Telegraf | null = null;

  constructor(config: INotificationConfig) {
    this.config = config;

    if (this.config.telegram?.botToken) {
      this.telegramBot = new Telegraf(this.config.telegram.botToken);
    }
  }

  public async sendNotification(message: string): Promise<void> {
    if (!this.config.enabled) {
      colorizedConsole.warn("Notifications are disabled");
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
        colorizedConsole.warn("No notification channels configured");
        return;
      }

      await Promise.all(sendPromises);
      colorizedConsole.accept("Notification sent successfully");
    } catch (error) {
      colorizedConsole.err(`Failed to send notification: ${error}`);
      throw error;
    }
  }

  public async sendResults(results: ILLMResult[]): Promise<void> {
    if (!results.length) {
      colorizedConsole.warn("No results to send");
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
      colorizedConsole.err(`Failed to send email: ${error}`);
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

      colorizedConsole.accept("Telegram message sent successfully");
    } catch (error) {
      colorizedConsole.err(`Failed to send Telegram message: ${error}`);
      throw error;
    }
  }

  public updateConfig(config: Partial<INotificationConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.telegram?.botToken) {
      this.telegramBot = new Telegraf(config.telegram.botToken);
    }

    colorizedConsole.accept("Notification config updated");
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }
}
