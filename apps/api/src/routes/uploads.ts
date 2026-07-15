import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "../db/prisma";
import { AppError } from "../lib/errors";
import { uploadFileToStorage } from "../lib/storage";
import { sanitizeFilename, validateMediaFile } from "../lib/mediaValidation";
import { downloadYoutubeVideo } from "../lib/youtubeDownload";
import type { CreateUploadResponse } from "@subtitle-app/shared";
import { writeRateLimiter } from "../middleware/rateLimiter";

const router = Router();
router.use(writeRateLimiter);

const MAX_UPLOAD_SIZE_BYTES =
  (process.env.MAX_UPLOAD_SIZE_MB ? Number(process.env.MAX_UPLOAD_SIZE_MB) : 500) *
  1024 *
  1024;

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
});

router.post("/", upload.single("file"), async (req, res, next) => {
  const file = req.file;
  const tempPath = file?.path;
  try {
    if (!file) {
      throw new AppError("E_VALIDATION", "No file was provided.", 400);
    }
    const { durationSeconds } = await validateMediaFile(file.path);
    const safeFilename = sanitizeFilename(file.originalname);
    const storageKey = `uploads/${crypto.randomUUID()}-${safeFilename}`;
    try {
      await uploadFileToStorage(file.path, storageKey, file.mimetype);
    } catch (storageErr) {
      console.error("[uploads] storage failure:", storageErr);
      throw new AppError(
        "E_STORAGE_FAILURE",
        "Could not store the uploaded file.",
        502
      );
    }
    const record = await prisma.upload.create({
      data: {
        originalFilename: file.originalname,
        storagePath: storageKey,
        mimeType: file.mimetype,
        fileSize: file.size,
        duration: durationSeconds,
        status: "uploaded",
      },
    });
    const response: CreateUploadResponse = {
      upload_id: record.id,
      filename: record.originalFilename,
      status: "uploaded",
    };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  } finally {
    if (tempPath) {
      fs.unlink(tempPath, () => {});
    }
  }
});

// POST /api/uploads/youtube - import a video by URL instead of a file.
// Downloads server-side with yt-dlp, then runs through the exact same
// validation/storage/DB path as a regular file upload.
router.post("/youtube", async (req, res, next) => {
  const { url } = req.body as { url?: string };
  const tempId = crypto.randomUUID();
  const tempPathWithoutExt = path.join(os.tmpdir(), tempId);
  let downloadedFilePath: string | undefined;

  try {
    if (!url) {
      throw new AppError("E_VALIDATION", "No URL was provided.", 400);
    }

    const { filePath, title } = await downloadYoutubeVideo(url, tempPathWithoutExt);
    downloadedFilePath = filePath;

    const { durationSeconds } = await validateMediaFile(filePath);

    const safeFilename = sanitizeFilename(`${title}.mp4`);
    const storageKey = `uploads/${crypto.randomUUID()}-${safeFilename}`;

    try {
      await uploadFileToStorage(filePath, storageKey, "video/mp4");
    } catch (storageErr) {
      console.error("[uploads] storage failure:", storageErr);
      throw new AppError(
        "E_STORAGE_FAILURE",
        "Could not store the downloaded video.",
        502
      );
    }

    const fileSize = fs.statSync(filePath).size;

    const record = await prisma.upload.create({
      data: {
        originalFilename: safeFilename,
        storagePath: storageKey,
        mimeType: "video/mp4",
        fileSize,
        duration: durationSeconds,
        status: "uploaded",
      },
    });

    const response: CreateUploadResponse = {
      upload_id: record.id,
      filename: record.originalFilename,
      status: "uploaded",
    };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  } finally {
    if (downloadedFilePath) {
      fs.unlink(downloadedFilePath, () => {});
    }
  }
});

export default router;
