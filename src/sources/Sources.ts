/** @format */

import {
  ISource,
  IArticle,
  ISourceGroupConfig,
  ISourceConfig,
  ISourceGroup,
} from "./types";
import { BaseSource } from "./BaseSource";
import { DvpToSource } from "./DvpToSource";
import { TelegramSource } from "./TelegramSource";
import { FinancialSource } from "./FinancialSource";
import { colorizedConsole } from "../helpers/console";

class SourceGroup {
  private sources: Map<string, ISource> = new Map();
  private config: ISourceGroup;
  private initialized: boolean = false;

  constructor(config: ISourceGroup) {
    this.config = config;
    this.initializeSources();
  }

  private initializeSources(): void {
    try {
      for (const sourceConfig of this.config.sources) {
        let source: ISource;

        switch (sourceConfig.type) {
          case "dvp":
            source = new DvpToSource(sourceConfig.tags);
            break;
          case "telegram":
            if (!sourceConfig.channels || sourceConfig.channels.length === 0) {
              colorizedConsole.warn(
                `No channels specified for Telegram source ${sourceConfig.name}`
              );
              continue;
            }
            source = new TelegramSource(
              sourceConfig.channels,
              sourceConfig.lookBackDays
            );
            break;
          case "financial":
            source = new FinancialSource();
            break;
          default:
            colorizedConsole.err(`Unknown source type: ${sourceConfig.type}`);
            continue;
        }

        this.sources.set(sourceConfig.name, source);
      }

      this.initialized = true;
      colorizedConsole.accept(
        `Initialized ${this.sources.size} sources for group ${this.config.name}`
      );
    } catch (error) {
      colorizedConsole.err(
        `Error initializing sources for group ${this.config.name}: ${error}`
      );
      throw error;
    }
  }

  public getSources(): ISource[] {
    return Array.from(this.sources.values());
  }

  public async fetchArticles(limit?: number): Promise<IArticle[]> {
    if (!this.initialized) {
      throw new Error(`Sources not initialized for group ${this.config.name}`);
    }

    const allArticles: IArticle[] = [];
    const fetchPromises: Promise<void>[] = [];

    colorizedConsole.accept(
      `Fetching articles from ${this.sources.size} sources in group ${this.config.name}...`
    );

    for (const [sourceName, source] of this.sources) {
      fetchPromises.push(
        (async () => {
          try {
            colorizedConsole.accept(
              `Fetching articles from ${sourceName} in group ${this.config.name}...`
            );
            const articlesData = await source.fetchArticles(limit);

            if (articlesData) {
              try {
                const articles = JSON.parse(articlesData);
                if (Array.isArray(articles)) {
                  const articlesWithSource = articles.map((article) => ({
                    ...article,
                    source: sourceName,
                    sourceGroup: this.config.id,
                  }));
                  allArticles.push(...articlesWithSource);
                } else {
                  allArticles.push({
                    ...articles,
                    source: sourceName,
                    sourceGroup: this.config.id,
                  });
                }
              } catch (parseError) {
                colorizedConsole.err(
                  `Error parsing articles from ${sourceName} in group ${this.config.name}: ${parseError}`
                );
              }
            }
          } catch (error) {
            colorizedConsole.err(
              `Error fetching articles from ${sourceName} in group ${this.config.name}: ${error}`
            );
          }
        })()
      );
    }

    await Promise.all(fetchPromises);

    colorizedConsole.accept(
      `Successfully fetched ${allArticles.length} articles from group ${this.config.name}`
    );
    return allArticles;
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public getId(): string {
    return this.config.id;
  }

  public getName(): string {
    return this.config.name;
  }
}

export class Sources {
  private sourceGroups: Map<string, SourceGroup> = new Map();
  private config: ISourceGroupConfig;
  private defaultGroupId?: string;

  constructor(config: ISourceGroupConfig) {
    this.config = config;
    this.defaultGroupId = config.defaultGroupId;
    this.initializeSourceGroups();
  }

  private initializeSourceGroups(): void {
    try {
      for (const group of this.config.groups) {
        if (group.enabled) {
          const sourceGroup = new SourceGroup(group);
          this.sourceGroups.set(group.id, sourceGroup);
        }
      }
      colorizedConsole.accept(
        `Initialized ${this.sourceGroups.size} source groups`
      );
    } catch (error) {
      colorizedConsole.err(`Error initializing source groups: ${error}`);
      throw error;
    }
  }

  public getSourceGroups(): SourceGroup[] {
    return Array.from(this.sourceGroups.values());
  }

  public getSourceGroup(groupId: string): SourceGroup | undefined {
    return this.sourceGroups.get(groupId);
  }

  public getDefaultSourceGroup(): SourceGroup | undefined {
    if (this.defaultGroupId) {
      return this.sourceGroups.get(this.defaultGroupId);
    }
    return undefined;
  }

  public async fetchAllArticles(limit?: number): Promise<IArticle[]> {
    if (this.sourceGroups.size === 0) {
      colorizedConsole.warn("No source groups configured");
      return [];
    }

    const allArticles: IArticle[] = [];
    const fetchPromises: Promise<void>[] = [];

    for (const [groupId, group] of this.sourceGroups) {
      if (group.isEnabled()) {
        fetchPromises.push(
          (async () => {
            try {
              const articles = await group.fetchArticles(limit);
              allArticles.push(...articles);
            } catch (error) {
              colorizedConsole.err(
                `Error fetching articles from group ${groupId}: ${error}`
              );
            }
          })()
        );
      }
    }

    await Promise.all(fetchPromises);

    colorizedConsole.accept(
      `Successfully fetched ${allArticles.length} articles from all source groups`
    );
    return allArticles;
  }

  public async fetchArticlesFromGroup(
    groupId: string,
    limit?: number
  ): Promise<IArticle[]> {
    const group = this.sourceGroups.get(groupId);

    if (!group) {
      colorizedConsole.err(`Source group ${groupId} not found`);
      return [];
    }

    if (!group.isEnabled()) {
      colorizedConsole.warn(`Source group ${groupId} is disabled`);
      return [];
    }

    return await group.fetchArticles(limit);
  }

  public getSources(): ISource[] {
    const allSources: ISource[] = [];
    for (const group of this.sourceGroups.values()) {
      if (group.isEnabled()) {
        allSources.push(...group.getSources());
      }
    }
    return allSources;
  }

  public updateGroupConfig(
    groupId: string,
    config: Partial<ISourceGroup>
  ): void {
    const group = this.sourceGroups.get(groupId);
    if (group) {
      const groupConfig = this.config.groups.find((g) => g.id === groupId);
      if (groupConfig) {
        Object.assign(groupConfig, config);
      }
    }
  }
}
