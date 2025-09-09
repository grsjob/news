import express, {
  Response,
  Request,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import { router } from "./router";
import { colorizedConsole } from "./helpers/console";
import { healthCheck, pool } from "./config/db";
import { Sources } from "@/sources/Sources";

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
});

process.on("SIGINT", async () => {
  colorizedConsole.accept("Server is shutting down...");
  await pool.end();
  process.exit(0);
});

const sources = new Sources();
(async () => {
  try {
    const allArticles = await sources.fetchAllArticles(10);
    colorizedConsole.accept(`Fetched ${allArticles.length} articles total`);
    
    const llmInput = await sources.getNewsForLLM(5);
    colorizedConsole.accept("LLM Input prepared successfully");
    console.log(llmInput);
    
    const dvpArticles = await sources.fetchArticlesFromSource("DvpTo", 5);
    colorizedConsole.accept(`Fetched ${dvpArticles.length} articles from DvpTo`);
  } catch (error) {
    colorizedConsole.err(`Error: ${error}`);
  }
})();
