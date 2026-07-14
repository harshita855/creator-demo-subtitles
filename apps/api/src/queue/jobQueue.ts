import { Queue } from "bullmq";
import { TRANSCRIPTION_QUEUE_NAME } from "@subtitle-app/shared";
import { getRedisConnectionOptions } from "./connection";

export const jobQueue = new Queue(TRANSCRIPTION_QUEUE_NAME, {
  connection: getRedisConnectionOptions(),
});