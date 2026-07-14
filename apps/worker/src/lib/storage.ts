import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";

const BUCKET = process.env.S3_BUCKET ?? "subtitle-app-media";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "",
  },
  forcePathStyle: true,
});

// Streams a stored file down to local disk so ffmpeg/Whisper can work
// with it as a real file - object storage clients don't give you a
// local path directly, so this bridges that gap.
export async function downloadFileFromStorage(
  storageKey: string,
  localDestPath: string
): Promise<void> {
  const response = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: storageKey })
  );
  if (!response.Body) {
    throw new Error(`No body returned for storage key: ${storageKey}`);
  }
  const writeStream = fs.createWriteStream(localDestPath);
  await pipeline(response.Body as NodeJS.ReadableStream, writeStream);
}
