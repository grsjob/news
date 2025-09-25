/** @format */

import { BaseSource } from "./BaseSource";
import { IArticle } from "./types";
import { colorizedConsole } from "@/helpers/console";
import axios from "axios";

export class FinancialSource extends BaseSource {
  readonly name = "financial";
  readonly baseUrl = "http://api.duma.gov.ru/api";

  async fetchArticles(limit?: number): Promise<string> {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    let formattedDate = date.toISOString().split("T")[0];

    try {
      const token = process.env.FINANCIAL_GOV_KEY;
      const appToken = process.env.FINANCIAL_GOV_APP_KEY;

      if (!token || !appToken) {
        throw new Error(
          "Financial API credentials not found in environment variables",
        );
      }

      const url = `${this.baseUrl}/${token}/transcriptFull/${formattedDate}.json?app_token=${appToken}`;

      colorizedConsole.accept(
        `Fetching financial data from Duma API for date: ${formattedDate}`,
      );

      const customAxios = axios.create({
        timeout: 30000, // 30 seconds timeout
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const response = await customAxios.get(url);

      if (!response.data) {
        throw new Error("No data received from Duma API");
      }

      const articles = this.transformResponseToArticles(
        response.data,
        formattedDate,
      );

      return JSON.stringify(articles);
    } catch (error: any) {
      if (error.code === "ECONNABORTED") {
        colorizedConsole.err(
          `Duma API request timeout for date: ${formattedDate}`,
        );
        return JSON.stringify([]);
      }

      if (
        error.code === "ECONNRESET" ||
        error.message?.includes("socket hang up")
      ) {
        colorizedConsole.err(
          `Duma API connection reset for date: ${formattedDate}`,
        );
        return JSON.stringify([]);
      }

      colorizedConsole.err(`Error fetching financial articles: ${error}`);
      return JSON.stringify([]);
    }
  }

  private transformResponseToArticles(data: any, date: string): IArticle[] {
    try {
      if (!data.meetings || !Array.isArray(data.meetings)) {
        colorizedConsole.warn(
          `No meetings found in Duma API response for date ${date}`,
        );
        return [];
      }

      const articles: IArticle[] = data.meetings.map(
        (meeting: any, index: number) => {
          const title = `Заседание Государственной Думы №${meeting.number || index + 1} от ${meeting.date || date}`;

          const content =
            meeting.lines && Array.isArray(meeting.lines)
              ? meeting.lines.join("\n").trim()
              : `Стенограмма заседания Государственной Думы от ${meeting.date || date}`;

          const url = `http://api.duma.gov.ru/api/${process.env.FINANCIAL_GOV_KEY}/transcriptFull/${date}.json`;

          return {
            id: this.generateId({
              title,
              content,
              url,
              source: this.name,
              publishedAt: new Date(meeting.date || date),
            }),
            title,
            content,
            url,
            source: this.name,
            publishedAt: new Date(meeting.date || date),
            tags: ["финансы", "госдума", "заседание", "стенограмма"],
          };
        },
      );

      colorizedConsole.accept(
        `Transformed ${data.meetings.length} meetings to articles`,
      );
      return articles;
    } catch (error) {
      colorizedConsole.err(`Error transforming Duma API response: ${error}`);
      throw error;
    }
  }
}
