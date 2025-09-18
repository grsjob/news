/** @format */

import { BaseSource } from "@/sources/BaseSource";
import { IArticle } from "@/sources/types";
import { colorizedConsole } from "@/helpers/console";
import axios from "axios";

export class TelegramSource extends BaseSource {
  readonly name = "Telegram";
  readonly baseUrl = "https://t.me/";

  private channels: string[] = [];

  constructor(channels: string[]) {
    super();
    this.channels = channels;
  }

  async fetchArticles(limit?: number): Promise<string> {
    try {
      const allArticles: IArticle[] = [];

      for (const channel of this.channels) {
        try {
          const channelPosts = await this.fetchChannelPosts(channel);
          allArticles.push(...channelPosts);
        } catch (error) {
          colorizedConsole.err(
            `Error fetching posts from channel ${channel}: ${error}`
          );
        }
      }

      if (limit !== undefined && allArticles.length > limit) {
        return JSON.stringify(allArticles.slice(0, limit));
      }

      return JSON.stringify(allArticles);
    } catch (error) {
      colorizedConsole.err(`Error fetching Telegram articles: ${error}`);
    }
    return "";
  }

  private async fetchChannelPosts(channel: string): Promise<IArticle[]> {
    const articles: IArticle[] = [];

    try {
      const now = new Date();
      const moscowTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Europe/Moscow" })
      );

      const startOfDay = new Date(moscowTime);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(moscowTime);
      endOfDay.setHours(23, 59, 59, 999);

      const startTime = Math.floor(startOfDay.getTime() / 1000);
      const endTime = Math.floor(endOfDay.getTime() / 1000);

      const rssUrl = `https://t.me/s/${channel}?before=${endTime}&after=${startTime}`;

      const response = await axios.get(rssUrl);

      if (response.status === 200) {
        const html = response.data as string;
        const posts = this.parseTelegramHTML(html, channel);
        articles.push(...posts);
      }

      return articles;
    } catch (error) {
      colorizedConsole.err(`Error fetching posts from ${channel}: ${error}`);
      return [];
    }
  }

  private parseTelegramHTML(html: string, channel: string): IArticle[] {
    const articles: IArticle[] = [];

    try {
      const postRegex =
        /<div class="tgme_widget_message[^"]*"[^>]*data-post="([^"]+)"[^>]*>[\s\S]*?(?:<time[^>]*datetime="([^"]*)"[^>]*>[^<]*<\/time>)?[\s\S]*?<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g;

      let match;
      while ((match = postRegex.exec(html)) !== null) {
        const postId = match[1];
        const publishTime = match[2];
        const content = match[3];

        const cleanContent = content
          .replace(/<[^>]*>/g, "")
          .replace(/\n+/g, " ")
          .trim();

        if (cleanContent) {
          const article: IArticle = {
            title: "",
            content: cleanContent,
            url: `https://t.me/${postId}`,
            source: this.name,
            publishedAt: publishTime ? new Date(publishTime) : new Date(),
          };

          articles.push(article);
        }
      }

      colorizedConsole.accept(
        `Parsed ${articles.length} posts from Telegram channel ${channel}`
      );
    } catch (error) {
      colorizedConsole.err(`Error parsing Telegram HTML: ${error}`);
    }

    return articles;
  }
}
