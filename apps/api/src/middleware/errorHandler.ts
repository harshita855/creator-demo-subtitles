import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../lib/errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  // Prisma's known error codes - map the common ones to sensible HTTP
  // responses instead of a generic 500, even if a route forgot to
  // check existence before acting on a record.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      // "Record to update/delete does not exist"
      return res.status(404).json({
        error: { code: "E_NOT_FOUND", message: "The requested resource was not found." },
      });
    }
    if (err.code === "P2002") {
      // Unique constraint violation
      return res.status(409).json({
        error: { code: "E_DUPLICATE_REQUEST", message: "This resource already exists." },
      });
    }
    // Any other Prisma error - log detail server-side, never leak the
    // raw Prisma message (it can contain table/column names) to the client.
    console.error("[api] unhandled Prisma error:", err.code, err.message);
    return res.status(500).json({
      error: { code: "E_INTERNAL", message: "A database error occurred." },
    });
  }

  // Unknown/unexpected error - log the real detail server-side only,
  // never leak it to the client (no stack traces, no internals).
  console.error("[api] unhandled error:", err);
  return res.status(500).json({
    error: { code: "E_INTERNAL", message: "An unexpected error occurred." },
  });
}
