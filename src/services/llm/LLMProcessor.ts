/** @format */

import axios from "axios";
import { colorizedConsole } from "@/helpers/console";
import {
  ILLMProcessor,
  ILLMResult,
  ICloudRuConfig,
  ILLMMessage,
  IArticle,
} from "./types";

interface CloudRuResponse {
  choices: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class LLMProcessor implements ILLMProcessor {
  private config: ICloudRuConfig;
  private processedResults: ILLMResult[] = [];
  private axiosInstance;

  constructor(config: ICloudRuConfig) {
    this.config = {
      maxTokens: 5000,
      temperature: 0.5,
      presencePenalty: 0,
      topP: 0.95,
      ...config,
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private createSystemPrompt(): string {
    return `Ты - опытный журналист и мемолог. Твоя задача - анализировать новостные статьи и создавать краткие выжимки в 2 предложения, добавляя к ним релевантные мемы и шутки.

Твоя работа:
1. Прочитать статью полностью
2. Создать краткую выжимку в РОВНО 2 предложения, передающих суть статьи
3. Придумать 2-3 релевантных мема или шутки, связанных с темой статьи
4. Ответ должен быть в формате JSON со следующей структурой:
{
  "summary": "Краткая выжимка в 2 предложения",
  "memes": ["мем1", "мем2", "мем3"],
  "jokes": ["шутка1", "шутка2"]
}

Важно:
- Выжимка должна быть информативной и лаконичной
- Мемы и шутки должны быть уместными и по теме
- Отвечай только в формате JSON без дополнительного текста`;
  }

  private createUserPrompt(article: IArticle): string {
    return `Проанализируй следующую статью и создай выжимку с мемами и шутками:

Название: ${article.title}
Источник: ${article.source}
URL статьи: ${article.url}
Дата публикации: ${article.publishedAt}
Содержание: ${article.content}`;
  }

  private parseLLMResponse(response: string): {
    summary: string;
    memes: string[];
    jokes: string[];
  } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("JSON not found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (
        !parsed.summary ||
        !Array.isArray(parsed.memes) ||
        !Array.isArray(parsed.jokes)
      ) {
        throw new Error("Invalid response structure");
      }

      return {
        summary: parsed.summary,
        memes: parsed.memes.slice(0, 3), // Ограничиваем до 3 мемов
        jokes: parsed.jokes.slice(0, 2), // Ограничиваем до 2 шуток
      };
    } catch (error) {
      colorizedConsole.err(`Error parsing LLM response: ${error}`);
      return {
        summary: "Не удалось обработать статью",
        memes: ["Ошибка обработки"],
        jokes: ["Попробуйте позже"],
      };
    }
  }

  private async callLLM(messages: ILLMMessage[]): Promise<string> {
    try {
      const response = await this.axiosInstance.post<CloudRuResponse>(
        "/chat/completions",
        {
          model: this.config.model,
          messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          presence_penalty: this.config.presencePenalty,
          top_p: this.config.topP,
        },
      );

      return response.data.choices[0]?.message?.content || "";
    } catch (error) {
      colorizedConsole.err(`Error calling LLM: ${error}`);
      throw error;
    }
  }

  public async processArticle(article: IArticle): Promise<ILLMResult> {
    try {
      const messages: ILLMMessage[] = [
        { role: "system", content: this.createSystemPrompt() },
        { role: "user", content: this.createUserPrompt(article) },
      ];

      const response = await this.callLLM(messages);
      const parsedResponse = this.parseLLMResponse(response);

      const result: ILLMResult = {
        id: this.generateId(),
        articleId: article.id || this.generateId(),
        source: article.source,
        title: article.title,
        url: article.url,
        summary: parsedResponse.summary,
        memes: parsedResponse.memes,
        jokes: parsedResponse.jokes,
        processedAt: new Date(),
      };

      colorizedConsole.accept(`Processed article: ${article.title}`);
      return result;
    } catch (error) {
      colorizedConsole.err(
        `Error processing article ${article.title}: ${error}`,
      );

      const errorResult: ILLMResult = {
        id: this.generateId(),
        articleId: article.id || this.generateId(),
        source: article.source,
        title: article.title,
        url: article.url,
        summary: "Ошибка при обработке статьи",
        memes: ["Ошибка"],
        jokes: ["Попробуйте позже"],
        processedAt: new Date(),
      };

      return errorResult;
    }
  }

  public async processArticles(articles: IArticle[]): Promise<ILLMResult[]> {
    if (!articles.length) {
      colorizedConsole.warn("No articles to process");
      return [];
    }

    colorizedConsole.accept(`Processing ${articles.length} articles...`);

    const results: ILLMResult[] = [];

    const concurrencyLimit = 3;
    const chunks = [];

    for (let i = 0; i < articles.length; i += concurrencyLimit) {
      chunks.push(articles.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const chunkPromises = chunk.map((article) =>
        this.processArticle(article),
      );
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    this.processedResults.push(...results);

    colorizedConsole.accept(
      `Successfully processed ${results.length} articles`,
    );
    return results;
  }

  public getResultsCount(): number {
    return this.processedResults.length;
  }
}
