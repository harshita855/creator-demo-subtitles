import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "node:fs";

const BUCKET = process.env.S3_BUCKET ?? "subtitle-app-media";

export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "",
  },
  forcePathStyle: true,
});

const s3Public = new S3Client({
  endpoint: process.env.S3_PUBLIC_ENDPOINT ?? "http://localhost:9000",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "",
  },
  forcePathStyle: true,
});

export async function ensureBucketExists(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log(`[storage] created bucket "${BUCKET}"`);
  }
}

export async function uploadFileToStorage(
  localFilePath: string,
  storageKey: string,
  contentType: string
): Promise<void> {
  const fileStream = fs.createReadStream(localFilePath);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: storageKey,
      Body: fileStream,
      ContentType: contentType,
    })
  );
}

export async function getPresignedDownloadUrl(
  storageKey: string,
  expiresInSeconds = 3600
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: storageKey });

  return getSignedUrl(s3Public, command, { expiresIn: expiresInSeconds });
}