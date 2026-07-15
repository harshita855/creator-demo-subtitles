import { AppError } from "../errors";
import { TTS_OUTPUT_FORMAT, TTS_CONTENT_TYPE } from "./config";

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

export interface SynthesizeParams {
  text: string;
  voiceId: string;
  modelId: string;
  languageCode?: string; // ISO 639-1, or omitted for auto-detect
  speed?: number; // 0.7 - 1.2
}

export interface SynthesizeResult {
  audio: Buffer;
  contentType: string;
  creditsUsed: string | null;
}

// Calls ElevenLabs text-to-speech and returns the raw audio bytes. All
// errors are translated into AppError with a client-safe message - we
// never leak the provider name, key, or raw upstream body to the user
// (spec §11).
export async function synthesizeSpeech(
  params: SynthesizeParams
): Promise<SynthesizeResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new AppError(
      "E_INTERNAL",
      "Text-to-speech is not configured on the server.",
      500
    );
  }

  const body: Record<string, unknown> = {
    text: params.text,
    model_id: params.modelId,
    voice_settings: {
      speed: params.speed ?? 1,
    },
  };
  if (params.languageCode && params.languageCode !== "auto") {
    body.language_code = params.languageCode;
  }

  let response: Response;
  try {
    response = await fetch(
      `${ELEVENLABS_BASE}/text-to-speech/${encodeURIComponent(
        params.voiceId
      )}?output_format=${TTS_OUTPUT_FORMAT}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: TTS_CONTENT_TYPE,
        },
        body: JSON.stringify(body),
      }
    );
  } catch {
    // Network-level failure reaching the provider.
    throw new AppError(
      "E_TTS_UNAVAILABLE",
      "The speech service is temporarily unreachable. Please try again.",
      503
    );
  }

  if (!response.ok) {
    throw mapProviderError(response.status, await safeReadText(response));
  }

  const audio = Buffer.from(await response.arrayBuffer());
  return {
    audio,
    contentType: response.headers.get("content-type") ?? TTS_CONTENT_TYPE,
    creditsUsed: response.headers.get("x-credits-used"),
  };
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function mapProviderError(status: number, rawBody: string): AppError {
  // Log the real upstream detail server-side only; keep it out of the
  // client response.
  console.error(`[tts] ElevenLabs error ${status}: ${rawBody.slice(0, 500)}`);

  if (status === 401) {
    // Free-tier lockouts / bad key surface here.
    return new AppError(
      "E_TTS_UNAVAILABLE",
      "The speech service rejected the request (account access issue). Check the TTS credentials or plan.",
      502
    );
  }
  if (status === 402) {
    return new AppError(
      "E_TTS_PAYMENT_REQUIRED",
      "This action needs a paid speech plan (e.g. a premium voice or voice cloning).",
      402
    );
  }
  if (status === 422 || status === 400) {
    return new AppError(
      "E_VALIDATION",
      "The speech request was invalid (unsupported voice, language, or text).",
      400
    );
  }
  if (status === 429) {
    return new AppError(
      "E_TTS_UNAVAILABLE",
      "The speech service is rate-limited right now. Please try again shortly.",
      429
    );
  }
  return new AppError(
    "E_TTS_UNAVAILABLE",
    "The speech service failed to generate audio. Please try again.",
    502
  );
}
