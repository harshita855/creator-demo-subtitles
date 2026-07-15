// Text-to-speech options, served to the frontend via GET /api/tts/options
// so the voice/model/language lists live in exactly one place.
//
// Voices below are ElevenLabs' default (free-tier-usable) voices. They
// were verified to return audio on the current key - "library" voices
// (e.g. Aria, Rachel, Charlotte) are paid-only and deliberately excluded
// so the dropdown never offers something that 402s.

export interface TtsVoice {
  id: string;
  name: string;
  description: string;
}

export const TTS_VOICES: TtsVoice[] = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Female · American · soft" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Male · British · warm" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Female · American · upbeat" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", description: "Male · Australian · natural" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", description: "Male · transatlantic · intense" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River", description: "Neutral · American · calm" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Male · American · articulate" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", description: "Female · British · clear" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", description: "Female · American · friendly" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will", description: "Male · American · conversational" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", description: "Female · American · expressive" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", description: "Male · American · smooth" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", description: "Male · American · casual" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", description: "Male · American · deep" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "Male · British · authoritative" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Female · British · warm" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill", description: "Male · American · trustworthy" },
];

export interface TtsModel {
  id: string;
  name: string;
  description: string;
}

export const TTS_MODELS: TtsModel[] = [
  { id: "eleven_flash_v2_5", name: "Flash v2.5", description: "Fastest · 30+ languages" },
  { id: "eleven_multilingual_v2", name: "Multilingual v2", description: "Highest quality · 29 languages" },
];

// ISO 639-1 codes accepted as an optional language hint. "auto" lets the
// model detect the language from the text itself (the default).
export interface TtsLanguage {
  code: string;
  label: string;
}

export const TTS_LANGUAGES: TtsLanguage[] = [
  { code: "auto", label: "Auto-detect" },
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "vi", label: "Vietnamese" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "pl", label: "Polish" },
  { code: "nl", label: "Dutch" },
  { code: "tr", label: "Turkish" },
  { code: "ru", label: "Russian" },
  { code: "ar", label: "Arabic" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "id", label: "Indonesian" },
  { code: "ta", label: "Tamil" },
];

// ElevenLabs returns mp3 or raw PCM (no WAV container), so we ship mp3.
export const TTS_OUTPUT_FORMAT = "mp3_44100_128";
export const TTS_CONTENT_TYPE = "audio/mpeg";

// Per-request character cap. ElevenLabs' free tier gives ~10,000 credits
// (≈ characters) PER MONTH total, so we keep a single request modest and
// surface the limit in the UI.
export const TTS_MAX_CHARS = 5000;

export const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah
export const DEFAULT_MODEL_ID = "eleven_flash_v2_5";
