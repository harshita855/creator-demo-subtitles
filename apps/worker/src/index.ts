import dotenv from "dotenv";
import { createLogger } from "@subtitle-app/shared";
import { startWorker } from "./queue/worker";

dotenv.config();

const logger = createLogger("worker");

logger.info("Worker starting, connecting to queue...");
startWorker();
logger.info("Worker listening for jobs");
