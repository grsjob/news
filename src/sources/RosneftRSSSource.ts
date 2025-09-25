/** @format */

import { RSSSource, RSSItem } from "./RSSSource";
import { IArticle } from "./types";
import { colorizedConsole } from "@/helpers/console";

export class RosneftRSSSource extends RSSSource {
  readonly name = "rosneft";
  readonly baseUrl = "https://www.rosneft.ru";

  constructor() {
    super("https://www.rosneft.ru/press/news/rss/");
  }

  protected getTagsForItem(item: RSSItem): string[] {
    const tags: string[] = ["роснефть", "нефть", "энергетика", "новости"];

    const title = (item.title || "").toLowerCase();
    const content = (item.content || item.contentSnippet || "").toLowerCase();

    if (title.includes("финанс") || content.includes("финанс")) {
      tags.push("финансы");
    }

    if (title.includes("инвест") || content.includes("инвест")) {
      tags.push("инвестиции");
    }

    if (title.includes("проект") || content.includes("проект")) {
      tags.push("проекты");
    }

    if (title.includes("добыч") || content.includes("добыч")) {
      tags.push("добыча");
    }

    if (title.includes("экспорт") || content.includes("экспорт")) {
      tags.push("экспорт");
    }

    if (title.includes("сделк") || content.includes("сделк")) {
      tags.push("сделки");
    }

    return tags;
  }
}
