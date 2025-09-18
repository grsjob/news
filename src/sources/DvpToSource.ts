/** @format */

import { BaseSource } from "@/sources/BaseSource";
import { IArticle } from "@/sources/types";
import { colorizedConsole } from "@/helpers/console";
import axiosInstance from "@/config/axios";

export class DvpToSource extends BaseSource {
  readonly name = "DvpTo";
  readonly baseUrl = "https://dev.to/api/articles/latest";
  private tags: string[] = ["javascript", "react", "typescript"];

  constructor(tags?: string[]) {
    super();
    if (tags && tags.length > 0) {
      this.tags = tags;
    }
  }

  async fetchArticles(limit?: number): Promise<string> {
    try {
      const queryParams = new URLSearchParams({
        page: "1",
      });

      for (const tag of this.tags) {
        queryParams.append("tag", tag);
      }

      if (limit !== undefined) {
        queryParams.append("per_page", limit.toString());
      }

      const url = `${this.baseUrl}?${queryParams.toString()}`;
      const response = await axiosInstance.get(url);

      if (response.status === 200) {
        const articles = response.data as IArticle[];
        return JSON.stringify(articles);
      }
    } catch (error) {
      colorizedConsole.err(`Error fetching articles: ${error}`);
    }
    return "";
  }
}
