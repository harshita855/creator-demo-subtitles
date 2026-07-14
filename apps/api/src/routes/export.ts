import { Router } from "express";
import { prisma } from "../db/prisma";
import { AppError } from "../lib/errors";
import { generateSrt } from "../lib/srt";
import { ExportQuerySchema } from "@subtitle-app/shared";

const router = Router();

// GET /api/projects/:projectId/export?language=original|translated|bilingual&format=srt|txt
router.get("/:projectId/export", async (req, res, next) => {
  try {
    const parsed = ExportQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(
        "E_VALIDATION",
        "Invalid export parameters: " + parsed.error.message,
        400
      );
    }
    const { language, format } = parsed.data;

    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: { segments: { orderBy: { sequenceNumber: "asc" } } },
    });
    if (!project) {
      throw new AppError("E_NOT_FOUND", "Project not found.", 404);
    }

    // Pick which text goes into the export, based on the requested language.
    const srtInput = project.segments.map((s) => ({
      start: s.startTime,
      end: s.endTime,
      text:
        language === "original"
          ? s.originalText
          : language === "translated"
          ? s.translatedText
          : // bilingual - original on one line, translated on the next,
            // within the same subtitle block. There's no single official
            // standard for this, so this is our own documented convention.
            `${s.originalText}\n${s.translatedText}`,
    }));

    let fileContent: string;
    let contentType: string;
    let fileExtension: string;

    if (format === "srt") {
      fileContent = generateSrt(srtInput);
      contentType = "application/x-subrip";
      fileExtension = "srt";
    } else {
      // Plain text export - just the text, no timestamps or numbering.
      fileContent = project.segments
        .map((s) =>
          language === "original"
            ? s.originalText
            : language === "translated"
            ? s.translatedText
            : `${s.originalText}\n${s.translatedText}`
        )
        .filter((line) => line.trim().length > 0)
        .join("\n\n");
      contentType = "text/plain";
      fileExtension = "txt";
    }

    const filename = `subtitles-${language}.${fileExtension}`;

    res.setHeader("Content-Type", `${contentType}; charset=utf-8`);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(fileContent);
  } catch (err) {
    next(err);
  }
});

export default router;
