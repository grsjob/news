/** @format */

import express, {
  Response,
  Request,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import { router } from "./router";
import { colorizedConsole } from "./helpers/console";
import { healthCheck, pool } from "./config/db";
import { Core } from "@/core/Core";
import { NotificationService } from "@/services/notification";
import { SchedulerService } from "@/services/scheduler";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(router);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

app.use(
  (
    error: ErrorRequestHandler,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    colorizedConsole.err(error);
    res.status(500).json({ error: errorMessage });
  },
);

app.listen(PORT, async () => {
  colorizedConsole.accept(`Server is running on ${PORT}`);

  const isHealthy = await healthCheck();

  if (!isHealthy) {
    colorizedConsole.warn("Warning: Database connection failed on startup");
  }

  try {
    const coreConfig = {
      llm: {
        apiKey: process.env.LLM_API_KEY || "your-api-key-here",
        model: process.env.LLM_MODEL || "Qwen/Qwen3-Coder-480B-A35B-Instruct",
        baseUrl:
          process.env.LLM_BASE_URL ||
          "https://foundation-models.api.cloud.ru/v1",
        maxTokens: 5000,
        temperature: 0.5,
        presencePenalty: 0,
        topP: 0.95,
      },
    };

    const core = new Core(coreConfig);

    const notificationConfig = {
      enabled: process.env.NOTIFICATIONS_ENABLED === "true",
      telegram:
        process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
          ? {
              botToken: process.env.TELEGRAM_BOT_TOKEN,
              chatId: process.env.TELEGRAM_CHAT_ID,
            }
          : undefined,
    };

    if (notificationConfig.enabled) {
      const notificationService = new NotificationService(notificationConfig);
      core.setNotificationService(notificationService);
    }

    await core.initialize();

    const schedulerConfig = {
      enabled: true,
      scheduleTime: "0 6 * * *", // 9 утра по Москве (7 AM UTC)
    };

    const schedulerService = new SchedulerService(schedulerConfig, core);
    schedulerService.start();

    const stats = core.getStatistics();
    colorizedConsole.accept(`\nStatistics:`);
    colorizedConsole.accept(
      `Total articles processed: ${stats.totalArticlesProcessed}`,
    );
    colorizedConsole.accept(`Sources count: ${stats.sourcesCount}`);
    colorizedConsole.accept(`Core initialized: ${stats.isInitialized}`);
  } catch (error) {
    colorizedConsole.err(
      `Error initializing core or processing news: ${error}`,
    );
  }
});

process.on("SIGINT", async () => {
  colorizedConsole.accept("Server is shutting down...");
  await pool.end();
  process.exit(0);
});
