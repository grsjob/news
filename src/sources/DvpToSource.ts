import { BaseSource } from "@/sources/BaseSource";
import { IArticle } from "@/sources/types";
import { colorizedConsole } from "@/helpers/console";
import axiosInstance from "@/config/axios";

export class DvpToSource extends BaseSource {
  readonly name = "DvpTo";
  readonly baseUrl = "https://dev.to/api/articles/latest";

  async fetchArticles(limit: number = 10): Promise<string> {
    try {
      const response = await axiosInstance.get(
        `${this.baseUrl}?page=1&per_page=${limit}&tag=javascript`,
      );
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
