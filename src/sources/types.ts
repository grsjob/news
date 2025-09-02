export interface ISource {
  readonly name: string;
  readonly baseUrl: string;
  //TODO заменить имплементацию возвращаемого значения на IArticle[]
  fetchArticles(limit?: number): Promise<string>;
}

export interface IArticle {
  id?: string;
  description?: string;
  title: string;
  content: string;
  url: string;
  source: string;
  publishedAt: Date;
  tags?: string[];
}
