import { ISource, IArticle } from "@/sources/types";
import { colorizedConsole } from "@/helpers/console";
import axiosInstance from "@/config/axios";

export abstract class BaseSource implements ISource {
  abstract readonly name: string;
  abstract readonly baseUrl: string;

  abstract fetchArticles(limit?: number): Promise<string>;

  protected generateId(article: IArticle): string {
    const base64Url = btoa(encodeURIComponent(article.url));
    return `${this.name}-${base64Url}`;
  }

  // protected async fetchHtml(url: string): Promise<string> {
  //   try {
  //     const response = await axiosInstance.get(url);
  //     return response.data;
  //   } catch (error) {
  //     colorizedConsole.err(`Error fetching HTML from ${url}:${error}`);
  //     throw error;
  //   }
  // }
}
