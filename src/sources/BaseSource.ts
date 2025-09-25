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
}
