/** @format */

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

export interface ISourceConfig {
  name: string;
  type: "dvp" | "telegram";
  channels?: string[];
  tags?: string[];
  limit?: number;
}

export interface ISourceGroup {
  id: string;
  name: string;
  sources: ISourceConfig[];
  enabled: boolean;
}

export interface ISourceGroupConfig {
  groups: ISourceGroup[];
  defaultGroupId?: string;
}
