import { BaseSource } from "@/sources/BaseSource";
import { IArticle } from "@/sources/types";
import { colorizedConsole } from "@/helpers/console";

export class DvpToSource extends BaseSource {
  readonly name = "DvpTo";
  readonly baseUrl = "https://dev.to/api/articles";

  async fetchArticles(limit: number = 10): Promise<string> {
    try {
      //TODO заменить а axios и добавить заголовок api-key
      const response = await fetch(
        `${this.baseUrl}?page=1&per_page=${limit}&tag=javascript`,
      );
      if (response.ok) {
        const articles = (await response.json()) as IArticle[];
        return JSON.stringify(articles[1].description);
      }
    } catch (error) {
      colorizedConsole.err(`Error fetching articles: ${error}`);
    }
    return "";
  }
}
