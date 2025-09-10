/** @format */

import { Pool, QueryResult } from "pg";
import { colorizedConsole } from "@/helpers/console";
import { IArticle } from "@/sources/types";
import { pool } from "@/config/db";

export interface IDBArticle {
  id: number;
  title: string;
  url: string;
  source: string;
  publishedAt: Date;
  sent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ArticlesDB {
  private pool: Pool;

  constructor(dbPool: Pool = pool) {
    this.pool = dbPool;
  }

  public async initializeTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS articles (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          url TEXT UNIQUE NOT NULL,
          source TEXT NOT NULL,
          published_at TIMESTAMP,
          sent BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_articles_title ON articles(title);
      CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url);
      CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
      CREATE INDEX IF NOT EXISTS idx_articles_sent ON articles(sent);
    `;

    try {
      await this.pool.query(query);
      colorizedConsole.accept("Articles table initialized successfully");
    } catch (error) {
      colorizedConsole.err(`Failed to initialize articles table: ${error}`);
      throw error;
    }
  }

  public async articleExistsByUrl(url: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        "SELECT 1 FROM articles WHERE url = $1 LIMIT 1",
        [url],
      );
      return (result.rowCount || 0) > 0;
    } catch (error) {
      colorizedConsole.err(`Error checking if article exists: ${error}`);
      throw error;
    }
  }

  public async saveArticle(article: IArticle): Promise<IDBArticle | null> {
    try {
      const publishedAt = article.publishedAt || new Date();

      const result = await this.pool.query(
        `INSERT INTO articles (title, url, source, published_at, sent)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (url) DO NOTHING
         RETURNING *`,
        [article.title, article.url, article.source, publishedAt, false],
      );

      if ((result.rowCount || 0) > 0) {
        colorizedConsole.accept(`Saved new article: ${article.title}`);
        return result.rows[0];
      } else {
        colorizedConsole.warn(`Article already exists: ${article.title}`);
        return null;
      }
    } catch (error) {
      colorizedConsole.err(`Error saving article: ${error}`);
      throw error;
    }
  }

  public async markArticleAsSent(url: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        "UPDATE articles SET sent = TRUE, updated_at = CURRENT_TIMESTAMP WHERE url = $1",
        [url],
      );
      return (result.rowCount || 0) > 0;
    } catch (error) {
      colorizedConsole.err(`Error marking article as sent: ${error}`);
      throw error;
    }
  }

  public async getUnsentArticles(): Promise<IDBArticle[]> {
    try {
      const result = await this.pool.query(
        "SELECT * FROM articles WHERE sent = FALSE ORDER BY created_at DESC",
        [],
      );
      return result.rows;
    } catch (error) {
      colorizedConsole.err(`Error getting unsent articles: ${error}`);
      throw error;
    }
  }

  public async deleteOldArticles(days: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await this.pool.query(
        "DELETE FROM articles WHERE published_at < $1 OR published_at IS NULL",
        [cutoffDate],
      );

      const deletedCount = result.rowCount || 0;
      colorizedConsole.accept(`Deleted ${deletedCount} old articles`);
      return deletedCount;
    } catch (error) {
      colorizedConsole.err(`Error deleting old articles: ${error}`);
      throw error;
    }
  }

  public async getStats(): Promise<{
    total: number;
    sent: number;
    unsent: number;
    old: number;
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.pool.query(
        `SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN sent = TRUE THEN 1 END) as sent,
          COUNT(CASE WHEN sent = FALSE THEN 1 END) as unsent,
          COUNT(CASE WHEN published_at < $1 OR published_at IS NULL THEN 1 END) as old
        FROM articles`,
        [thirtyDaysAgo],
      );

      return result.rows[0];
    } catch (error) {
      colorizedConsole.err(`Error getting article stats: ${error}`);
      throw error;
    }
  }
}
