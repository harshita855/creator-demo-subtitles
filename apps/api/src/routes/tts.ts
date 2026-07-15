import { Router } from "express";
import multer from "multer";
import { AppError } from "../lib/errors";
import { synthesizeSpeech } from "../lib/tts/elevenlabs";
import {
  TTS_VOICES,
  TTS_MODELS,
  TTS_LANGUAGES,
  TTS_MAX_CHARS,
  TTS_CONTENT_TYPE,
  DEFAULT_VOICE_ID,
  DEFAULT_MODEL_ID,
} from "../lib/tts/config";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 11 * 1024 * 1024, files: 5 }, // 11MB per sample
});

const VOICE_IDS = new Set(TTS_VOICES.map((v) => v.id));
const MODEL_IDS = new Set(TTS_MODELS.map((m) => m.id));
const LANGUAGE_CODES = new Set(TTS_LANGUAGES.map((l) => l.code));

// GET /api/tts/options - lists voices/models/languages/limits so the
// frontend never hardcodes them.
router.get("/options", (_req, res) => {
  res.status(200).json({
    voices: TTS_VOICES,
    models: TTS_MODELS,
    languages: TTS_LANGUAGES,
    maxChars: TTS_MAX_CHARS,
    defaultVoiceId: DEFAULT_VOICE_ID,
    defaultModelId: DEFAULT_MODEL_ID,
  });
});

// POST /api/tts - synthesize speech from text, returns an audio file.
router.post("/", async (req, res, next) => {
  try {
    const { text, voiceId, modelId, languageCode, speed } = req.body ?? {};

    if (typeof text !== "string" || text.trim().length === 0) {
      throw new AppError("E_VALIDATION", "Please provide some text to speak.", 400);
    }
    if (text.length > TTS_MAX_CHARS) {
      throw new AppError(
        "E_VALIDATION",
        `Text is too long (${text.length} chars). The limit is ${TTS_MAX_CHARS}.`,
        400
      );
    }

    const chosenVoice = typeof voiceId === "string" && VOICE_IDS.has(voiceId) ? voiceId : DEFAULT_VOICE_ID;
    const chosenModel = typeof modelId === "string" && MODEL_IDS.has(modelId) ? modelId : DEFAULT_MODEL_ID;
    const chosenLang =
      typeof languageCode === "string" && LANGUAGE_CODES.has(languageCode) ? languageCode : "auto";

    let chosenSpeed = 1;
    if (typeof speed === "number" && Number.isFinite(speed)) {
      chosenSpeed = Math.min(1.2, Math.max(0.7, speed));
    }

    const result = await synthesizeSpeech({
      text,
      voiceId: chosenVoice,
      modelId: chosenModel,
      languageCode: chosenLang,
      speed: chosenSpeed,
    });

    res.setHeader("Content-Type", result.contentType || TTS_CONTENT_TYPE);
    res.setHeader("Content-Disposition", 'inline; filename="speech.mp3"');
    if (result.creditsUsed) {
      res.setHeader("X-Credits-Used", result.creditsUsed);
    }
    res.status(200).send(result.audio);
  } catch (err) {
    next(err);
  }
});

// POST /api/tts/clone - create a cloned voice from uploaded samples.
// Wired and ready, but ElevenLabs voice cloning requires a paid plan;
// on the free tier this returns a clean "paid plan required" error.
router.post("/clone", upload.array("samples", 5), async (req, res, next) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new AppError("E_INTERNAL", "Text-to-speech is not configured on the server.", 500);
    }

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!name) {
      throw new AppError("E_VALIDATION", "Please give the cloned voice a name.", 400);
    }
    if (files.length === 0) {
      throw new AppError("E_VALIDATION", "Please upload at least one voice sample.", 400);
    }

    const form = new FormData();
    form.append("name", name);
    for (const file of files) {
      form.append(
        "files",
        new Blob([Uint8Array.from(file.buffer)], { type: file.mimetype || "audio/mpeg" }),
        file.originalname || "sample.mp3"
      );
    }

    let response: Response;
    try {
      response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
        method: "POST",
        headers: { "xi-api-key": apiKey },
        body: form,
      });
    } catch {
      throw new AppError("E_TTS_UNAVAILABLE", "The speech service is temporarily unreachable.", 503);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`[tts] clone error ${response.status}: ${body.slice(0, 500)}`);
      if (response.status === 401 || response.status === 402) {
        throw new AppError(
          "E_TTS_PAYMENT_REQUIRED",
          "Voice cloning requires a paid speech plan. Upgrade the plan to enable it.",
          402
        );
      }
      throw new AppError("E_TTS_UNAVAILABLE", "Voice cloning failed. Please try again.", 502);
    }

    const data = (await response.json()) as { voice_id?: string };
    res.status(201).json({ voice_id: data.voice_id, name });
  } catch (err) {
    next(err);
  }
});

export default router;
