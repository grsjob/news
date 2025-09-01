import express, {
  Response,
  Request,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import { router } from "./router";
import { colorizedConsole } from "./helpers/console";
import { healthCheck, pool } from "./config/db";

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
