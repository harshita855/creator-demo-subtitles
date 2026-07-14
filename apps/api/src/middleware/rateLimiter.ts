import rateLimit from "express-rate-limit";

// Applies to upload and job-creation endpoints specifically - these are
// the expensive ones (file storage, triggering background processing),
// so they're the ones worth protecting from being spammed.
export const writeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "E_VALIDATION",
      message: "Too many requests. Please try again later.",
    },
  },
});
