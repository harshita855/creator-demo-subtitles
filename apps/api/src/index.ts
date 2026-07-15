import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { createLogger } from "@subtitle-app/shared";
import uploadsRouter from "./routes/uploads";
import { errorHandler } from "./middleware/errorHandler";
import { ensureBucketExists } from "./lib/storage";
import jobsRouter from "./routes/jobs";
import projectsRouter from "./routes/projects";
import exportRouter from "./routes/export";
import ttsRouter from "./routes/tts";

dotenv.config();

const logger = createLogger("api");
const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors({ exposedHeaders: ["X-Credits-Used", "Content-Disposition"] }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "api" });
});

app.use("/api/uploads", uploadsRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/projects", exportRouter);
app.use("/api/tts", ttsRouter);

app.use((_req, res) => {
  res.status(404).json({
    error: { code: "E_NOT_FOUND", message: "The requested endpoint does not exist." },
  });
});

app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      logger.warn("Upload rejected - file too large", { path: req.path });
      return res.status(413).json({
        error: {
          code: "E_FILE_TOO_LARGE",
          message: "The uploaded file exceeds the maximum allowed size.",
        },
      });
    }
    next(err);
  }
);

app.use(errorHandler);

async function start() {
  await ensureBucketExists();
  app.listen(PORT, () => {
    logger.info("API server started", { port: PORT });
  });
}

start();
