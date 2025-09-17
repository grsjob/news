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
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const tomorrow = new Date(yesterday);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const rssUrl = `https://t.me/s/${channel}?before=${Math.floor(tomorrow.getTime() / 1000)}&after=${Math.floor(yesterday.getTime() / 1000)}`;

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
        /<div class="tgme_widget_message[^"]*"[^>]*data-post="([^"]+)"[^>]*>[\s\S]*?<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g;

      let match;
      while ((match = postRegex.exec(html)) !== null) {
        const postId = match[1];
        const content = match[2];

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
            publishedAt: new Date(),
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
