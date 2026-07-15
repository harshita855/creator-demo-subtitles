import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { createLogger } from "@subtitle-app/shared";
import { AppError } from "../lib/errors";

const logger = createLogger("api");

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    logger.warn("Request failed", {
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      logger.warn("Resource not found", { path: req.path, method: req.method });
      return res.status(404).json({
        error: { code: "E_NOT_FOUND", message: "The requested resource was not found." },
      });
    }
    if (err.code === "P2002") {
      logger.warn("Duplicate resource", { path: req.path, method: req.method });
      return res.status(409).json({
        error: { code: "E_DUPLICATE_REQUEST", message: "This resource already exists." },
      });
    }
    logger.error("Unhandled Prisma error", {
      prismaCode: err.code,
      prismaMessage: err.message,
      path: req.path,
    });
    return res.status(500).json({
      error: { code: "E_INTERNAL", message: "A database error occurred." },
    });
  }

  logger.error("Unhandled error", {
    message: err instanceof Error ? err.message : String(err),
    path: req.path,
    method: req.method,
  });
  return res.status(500).json({
    error: { code: "E_INTERNAL", message: "An unexpected error occurred." },
  });
}
