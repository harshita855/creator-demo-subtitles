import dotenv from "dotenv";
import { startWorker } from "./queue/worker";

dotenv.config();

console.log("[worker] starting, connecting to queue...");

startWorker();

console.log("[worker] listening for jobs");