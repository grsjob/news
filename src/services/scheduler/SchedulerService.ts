/** @format */

import cron = require("node-cron");
import { colorizedConsole } from "@/helpers/console";
import { ISchedulerService, ISchedulerConfig } from "./types";
import { Core } from "@/core/Core";

export class SchedulerService implements ISchedulerService {
  private config: ISchedulerConfig;
  private core: Core;
  private task: cron.ScheduledTask | null = null;

  constructor(config: ISchedulerConfig, core: Core) {
    this.config = config;
    this.core = core;
  }

  public start(): void {
    if (!this.config.enabled) {
      colorizedConsole.warn("Scheduler is disabled");
      return;
    }

    try {
      //9 утра по Москве
      this.task = cron.schedule(this.config.scheduleTime, async () => {
        colorizedConsole.accept(
          "Running scheduled task: Fetch articles and cleanup"
        );
        await this.runScheduledTask();
      });

      colorizedConsole.accept("Scheduler started successfully");
    } catch (error) {
      colorizedConsole.err(`Failed to start scheduler: ${error}`);
      throw error;
    }
  }

  public stop(): void {
    if (this.task) {
      this.task.stop();
      colorizedConsole.accept("Scheduler stopped");
    }
  }

  public async runScheduledTask(): Promise<void> {
    try {
      const deletedCount = await this.core.cleanupOldArticles(7);
      colorizedConsole.accept(
        `Cleaned up ${deletedCount} old articles during scheduled task`
      );

      const sourceGroups = this.core.getSourceGroups();
      let totalProcessed = 0;

      for (const sourceGroup of sourceGroups) {
        if (sourceGroup.isEnabled()) {
          colorizedConsole.accept(
            `Processing source group: ${sourceGroup.getName()}`
          );

          const results = await this.core.fetchAndProcessNewsByGroup(
            sourceGroup.getId()
          );

          totalProcessed += results.length;

          colorizedConsole.accept(
            `Completed processing source group ${sourceGroup.getName()}: ${results.length} articles processed`
          );
        }
      }

      colorizedConsole.accept(
        `Scheduled task completed: ${totalProcessed} new articles processed across all source groups`
      );
    } catch (error) {
      colorizedConsole.err(`Error in scheduled task: ${error}`);
      throw error;
    }
  }
}
