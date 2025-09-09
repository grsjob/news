import { colorizedConsole } from "@/helpers/console";
import { INotificationService, INotificationConfig, ILLMResult } from "./types";

export class NotificationService implements INotificationService {
  private config: INotificationConfig;

  constructor(config: INotificationConfig) {
    this.config = config;
  }

  public async sendNotification(message: string): Promise<void> {
    if (!this.config.enabled) {
      colorizedConsole.warn("Notifications are disabled");
      return;
    }

    try {
      if (this.config.email) {
        await this.sendEmail(message);
      }

      if (this.config.telegram) {
        await this.sendTelegram(message);
      }

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

  private async sendTelegram(message: string): Promise<void> {
    if (!this.config.telegram) {
      return;
    }

    try {
      // Здесь должна быть логика отправки в Telegram
      // Для примера просто выводим в консоль
      colorizedConsole.accept(
        `Telegram message would be sent to chat: ${this.config.telegram.chatId}`
      );
      colorizedConsole.accept(
        `Telegram content: ${message.substring(0, 100)}...`
      );
    } catch (error) {
      colorizedConsole.err(`Failed to send Telegram message: ${error}`);
      throw error;
    }
  }

  public updateConfig(config: Partial<INotificationConfig>): void {
    this.config = { ...this.config, ...config };
    colorizedConsole.accept("Notification config updated");
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }
}
