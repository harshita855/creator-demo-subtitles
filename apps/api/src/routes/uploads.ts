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

export default router;