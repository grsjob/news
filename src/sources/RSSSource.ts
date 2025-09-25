/** @format */

import { BaseSource } from "./BaseSource";
import { IArticle } from "./types";
import { colorizedConsole } from "@/helpers/console";
import axios from "axios";
import Parser, { CustomFieldItem } from "rss-parser";

export interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  isoDate?: string;
}

export abstract class RSSSource extends BaseSource {
  protected rssUrl: string;
  protected parser: Parser<{}, { [key: string]: any }>;
  protected customTags?: string[];

  constructor(rssUrl: string, customTags?: string[]) {
    super();
    this.rssUrl = rssUrl;
    this.parser = new Parser({
      customFields: {
        item: customTags || [],
      },
    });
  }

  async fetchArticles(limit?: number): Promise<string> {
    try {
      colorizedConsole.accept(`Fetching RSS feed from ${this.rssUrl}`);

      const customAxios = axios.create({
        timeout: 30000, // 30 seconds timeout
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml, */*",
          "Content-Type": "application/xml",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const response = await customAxios.get(this.rssUrl);

      if (!response.data) {
        throw new Error("No data received from RSS feed");
      }

      const feed = await this.parser.parseString(response.data as string);

      if (!feed.items || feed.items.length === 0) {
        colorizedConsole.warn(`No items found in RSS feed from ${this.rssUrl}`);
        return JSON.stringify([]);
      }

      const items = limit ? feed.items.slice(0, limit) : feed.items;
      const articles = this.transformRSSItemsToArticles(items);

      colorizedConsole.accept(
        `Successfully parsed ${articles.length} articles from RSS feed`
      );

      return JSON.stringify(articles);
    } catch (error: any) {
      if (error.code === "ECONNABORTED") {
        colorizedConsole.err(`RSS feed request timeout for ${this.rssUrl}`);
        return JSON.stringify([]);
      }

      if (
        error.code === "ECONNRESET" ||
        error.message?.includes("socket hang up")
      ) {
        colorizedConsole.err(`RSS feed connection reset for ${this.rssUrl}`);
        return JSON.stringify([]);
      }

      colorizedConsole.err(`Error fetching RSS articles: ${error}`);
      return JSON.stringify([]);
    }
  }

  protected transformRSSItemsToArticles(items: RSSItem[]): IArticle[] {
    return items
      .filter((item) => item.title && item.link)
      .map((item) => {
        const publishedAt = item.isoDate
          ? new Date(item.isoDate)
          : item.pubDate
            ? new Date(item.pubDate)
            : new Date();

        return {
          id: this.generateId({
            title: item.title || "",
            content: item.content || item.contentSnippet || "",
            url: item.link || "",
            source: this.name,
            publishedAt,
          }),
          title: item.title || "",
          content: item.content || item.contentSnippet || "",
          url: item.link || "",
          source: this.name,
          publishedAt,
          tags: this.getTagsForItem(item),
        };
      });
  }

  protected abstract getTagsForItem(item: RSSItem): string[];
}
