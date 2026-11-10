import { supabase } from "@/lib/supabase";

function isValidWorkingModel(m?: string | null): boolean {
  if (!m) return false;
  const lower = m.toLowerCase().trim();
  // Filter out legacy models that 404, hang, or are discontinued
  return (
    lower !== "gemini-2.5-flash" &&
    lower !== "gemini-flash-latest" &&
    lower !== "gemini-1.5-pro" &&
    lower !== "gemini-2.0-flash" &&
    lower !== "gemini-2.5-flash-lite"
  );
}

const configuredModel = import.meta.env.VITE_GEMINI_MODEL?.trim();

export const geminiModel = isValidWorkingModel(configuredModel) ? configuredModel! : "gemini-3.5-flash-lite";

let cachedDbModel: string | null = null;

export const fallbackModels = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
];

export function getActiveGeminiModel(): string {
  if (cachedDbModel && isValidWorkingModel(cachedDbModel)) {
    return cachedDbModel;
  }
  if (typeof localStorage !== "undefined") {
    const local = localStorage.getItem("system_ai_model");
    if (local && isValidWorkingModel(local)) {
      return local;
    }
  }
  const envModel = import.meta.env.VITE_GEMINI_MODEL?.trim();
  if (envModel && isValidWorkingModel(envModel)) {
    return envModel;
  }
  return "gemini-3.5-flash-lite";
}

let cachedDbApiKey: string | null = null;

export type GeminiContentPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export type GeminiContent = {
  role?: "user" | "model";
  parts: GeminiContentPart[];
};

export type GeminiOptions = {
  systemInstruction?: string;
  contents?: GeminiContent[];
  prompt?: string;
  images?: Array<{ base64: string; mimeType: string }> | string;
  mimeType?: string;
  maxOutputTokens?: number;
  temperature?: number;
  responseSchema?: object;
  responseMimeType?: string;
};

export function isAdminUser(): boolean {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return false;
  try {
    const rawProfile = localStorage.getItem("user_profile");
    if (rawProfile) {
      const parsed = JSON.parse(rawProfile);
      if (parsed.role === "admin") return true;
    }
    const directRole = localStorage.getItem("user_role");
    if (directRole === "admin") return true;
  } catch (e) {
    // Ignore JSON parse errors
  }
  return false;
}

/**
 * Fetches the system API key and configured model asynchronously from Supabase `system_settings` table.
 */
export async function fetchSystemApiKeyFromDb(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["gemini_api_key", "system_api_key", "ai_model"]);

    if (!error && data) {
      for (const row of data) {
        if ((row.key === "gemini_api_key" || row.key === "system_api_key") && row.value) {
          cachedDbApiKey = row.value.trim();
          if (typeof localStorage !== "undefined" && cachedDbApiKey) {
            localStorage.setItem("system_gemini_api_key", cachedDbApiKey);
          }
        }
        if (row.key === "ai_model" && row.value) {
          const val = row.value.trim();
          if (isValidWorkingModel(val)) {
            cachedDbModel = val;
            if (typeof localStorage !== "undefined") {
              localStorage.setItem("system_ai_model", val);
            }
          } else {
            cachedDbModel = "gemini-3.5-flash-lite";
            if (typeof localStorage !== "undefined") {
              localStorage.setItem("system_ai_model", "gemini-3.5-flash-lite");
            }
          }
        }
      }
      return cachedDbApiKey;
    }
  } catch (err) {
  }
  return null;
}

/**
 * Saves/upserts the system API key in Supabase `system_settings` (Admin only).
 */
export async function saveSystemApiKeyToDb(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      const { error } = await supabase
        .from("system_settings")
        .delete()
        .eq("key", "gemini_api_key");

      if (error) return { success: false, error: error.message };
      cachedDbApiKey = null;
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("system_gemini_api_key");
        localStorage.removeItem("custom_gemini_api_key");
      }
      return { success: true };
    }

    const { error } = await supabase.from("system_settings").upsert(
      {
        key: "gemini_api_key",
        value: trimmed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    if (error) {
      return { success: false, error: error.message };
    }

    cachedDbApiKey = trimmed;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("system_gemini_api_key", trimmed);
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Database save failed.",
    };
  }
}

export function getGeminiApiKey(): string {
  // 1. Check in-memory cached database key or localStorage
  const dbKey = cachedDbApiKey || (typeof localStorage !== "undefined" ? localStorage.getItem("system_gemini_api_key") || localStorage.getItem("custom_gemini_api_key") : null);
  if (dbKey && dbKey.trim()) {
    return dbKey.trim();
  }

  // 2. Check environment variables (.env)
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  const windowKey = typeof window !== "undefined"
    ? (window as any).__ENV?.VITE_GEMINI_API_KEY || (window as any).VITE_GEMINI_API_KEY
    : null;

  return (envKey || windowKey || "").trim();
}

const getGeminiError = (payload: unknown, status: number, fallback: string) => {
  if (status === 401) {
    return "Invalid Gemini API key (401 Unauthorized). The key is rejected by Google. Obtain a valid Google AI Studio key starting with 'AIzaSy' from https://aistudio.google.com and update your database/env settings.";
  }
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error
  ) {
    return String(payload.error.message);
  }
  return fallback;
};

// Default system instruction to enforce strict accuracy, material grounding, relevance double-check, and Socratic guidance.
const DEFAULT_TEACHING_SYSTEM_INSTRUCTION = `You are PureLearn AI, an elite educational tutor whose highest core principle is ABSOLUTE ACCURACY, STRICT CONTEXT RELEVANCE, AND SOCRATIC EMPOWERMENT.

MANDATORY PEDAGOGICAL & ACCURACY RULES:
1. EDUCATOR MATERIAL GROUNDING & AUTONOMOUS SYNTHESIS:
   - When learning materials or curriculum documents uploaded by an educator or trainer are present, autonomously ingest them as the primary authoritative source. Use them to formulate an in-depth learning guide, extract key theorems and concepts, and generate structured Socratic study notes and flashcards supporting the educator's curriculum.
   - If NO educator materials are provided, seamlessly and autonomously rely on your deep pedagogical AI intelligence to deliver a world-class, authoritative Socratic response.
   - CRITICAL PROHIBITION: DO NOT EVER mention, state, or hint that there are no materials added by an educator, or that a topic is missing from materials. Never say "No materials were provided by your teacher" or "This is not in your uploaded notes". Simply deliver the complete, accurate Socratic explanation seamlessly.
2. RELEVANCE DOUBLE-CHECK: Before finalizing any response, verify internally: "Does this explanation directly and accurately address the student's specific prompt without drifting into irrelevant tangents?" If any paragraph, formula, or example does not directly serve the student's prompt, eliminate it immediately.
3. EMPATHETIC, EMPOWERING SOCRATIC STYLE: Never make the student feel dumb or inadequate. Always empower them. If they struggle or make mistakes, offer intuitive mental models and real-world analogies (e.g. "Imagine playing a video game where...").
4. HIGH-LEVEL STRUCTURE: For concepts requested, follow this clean hierarchy:
   - 1) Purpose & Problem Solved: Why this concept exists.
   - 2) Real-World & Practical Application: Where it is applied.
   - 3) High-Level Mechanism: The procedural steps, formulas, or code.
   - 4) Guided Discovery: Guide them with a thought-provoking hint or self-check question rather than just spoon-feeding the end solution.`;

/**
 * Fetch wrapper with exponential backoff and randomized jitter for 429 and transient errors.
 * Includes timeout control so unresponsive models never hang indefinitely.
 */
async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  retries = 1,
  initialDelayMs = 400,
  timeoutMs = 8000,
): Promise<Response> {
  let attempt = 0;
  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    if (options.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) return response;

      // Rate limit (429): do a single fast retry with jitter
      if (response.status === 429 && attempt < retries) {
        attempt++;
        const jitter = Math.random() * 200;
        const delay = initialDelayMs * Math.pow(2, attempt - 1) + jitter;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // On 404 (model deprecated), 400 (bad parameter), or 503 (model overloaded),
      // DO NOT waste time retrying the same broken model - return immediately so caller
      // instantly fails over to the next candidate model!
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      if (attempt < retries && !(err instanceof DOMException && err.name === "AbortError")) {
        attempt++;
        const jitter = Math.random() * 200;
        const delay = initialDelayMs * Math.pow(2, attempt - 1) + jitter;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Maximum retry attempts reached");
}

function buildPayload(options: GeminiOptions) {
  let contentsPayload: GeminiContent[] = [];

  if (options.contents && options.contents.length > 0) {
    contentsPayload = options.contents;
  } else {
    const userParts: GeminiContentPart[] = [];

    if (options.images) {
      if (typeof options.images === "string") {
        userParts.push({ inlineData: { mimeType: options.mimeType || "image/jpeg", data: options.images } });
      } else {
        options.images.forEach((img) => {
          userParts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
        });
      }
    }

    if (options.prompt) {
      userParts.push({ text: options.prompt });
    }

    contentsPayload = [{ role: "user", parts: userParts }];
  }

  const generationConfig: Record<string, any> = {
    temperature: options.temperature ?? 0.7,
    maxOutputTokens: options.maxOutputTokens ?? 2048,
  };

  if (options.responseMimeType) {
    generationConfig.responseMimeType = options.responseMimeType;
  }
  if (options.responseSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = options.responseSchema;
  }

  const payload: Record<string, any> = {
    contents: contentsPayload,
    generationConfig,
  };

  // Ensure a default Socratic teaching system instruction is applied when none is provided and not in structured JSON mode.
  if (!options.systemInstruction && !options.responseSchema) {
    options.systemInstruction = DEFAULT_TEACHING_SYSTEM_INSTRUCTION;
  }

  if (options.systemInstruction) {
    // Avoid duplicating default instruction if caller already included it
    const finalInstruction = options.systemInstruction.includes("PureLearn AI")
      ? options.systemInstruction
      : `${DEFAULT_TEACHING_SYSTEM_INSTRUCTION}\n\n${options.systemInstruction}`;

    payload.systemInstruction = {
      parts: [{ text: finalInstruction }],
    };
  }

  return payload;
}

export async function generateGeminiText(
  promptOrOptions: string | GeminiOptions,
  maxTokens = 2048,
): Promise<{ text: string; model: string }> {
  if (!cachedDbApiKey) {
    await fetchSystemApiKeyFromDb();
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY in system environment (.env) or database. Restart dev server or add it via Admin Settings.");
  }

  const options: GeminiOptions =
    typeof promptOrOptions === "string"
      ? { prompt: promptOrOptions, maxOutputTokens: maxTokens }
      : promptOrOptions;

  const activeModel = getActiveGeminiModel();
  const models = Array.from(new Set([activeModel, ...fallbackModels]));
  const failures: string[] = [];

  const bodyPayload = buildPayload(options);

  for (const model of models) {
    try {
      const response = await fetchWithBackoff(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
        },
        1,
        300,
        8000,
      );

      const data = await response.json().catch(() => ({}));
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (response.ok && text) {
        return { text, model };
      }

      failures.push(`${model}: ${getGeminiError(data, response.status, "Gemini returned no text.")}`);
    } catch (err) {
      failures.push(`${model}: ${err instanceof Error ? err.message : "Network request failed."}`);
    }
  }

  throw new Error(`Gemini did not respond. ${failures.join(" | ")}`);
}

export async function generateGeminiMultimodal(
  prompt: string,
  images: Array<{ base64: string; mimeType: string }> | string,
  mimeType?: string,
  maxOutputTokens = 2048,
): Promise<{ text: string; model: string }> {
  return generateGeminiText({
    prompt,
    images,
    mimeType,
    maxOutputTokens,
    temperature: 0.4,
  });
}

/**
 * Native Server-Sent Events (SSE) response chunk streaming for real-time UI token updates.
 */
export async function streamGeminiText(
  options: GeminiOptions,
  onChunk: (textChunk: string) => void,
): Promise<{ text: string; model: string }> {
  if (!cachedDbApiKey) {
    await fetchSystemApiKeyFromDb();
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY in system environment (.env) or database. Restart dev server or add it via Admin Settings.");
  }

  const activeModel = getActiveGeminiModel();
  const models = Array.from(new Set([activeModel, ...fallbackModels]));
  const failures: string[] = [];

  const bodyPayload = buildPayload(options);

  for (const model of models) {
    try {
      const response = await fetchWithBackoff(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
        },
        1,
        300,
        8000,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        failures.push(`${model}: ${getGeminiError(errorData, response.status, "Stream connection failed")}`);
        continue;
      }

      if (!response.body) {
        failures.push(`${model}: Response body is null`);
        continue;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const rawJson = trimmed.slice(6);
            if (rawJson === "[DONE]") continue;
            try {
              const parsed = JSON.parse(rawJson);
              const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (chunkText) {
                fullText += chunkText;
                onChunk(chunkText);
              }
            } catch {
              // Ignore partial line JSON errors
            }
          }
        }
      }

      if (fullText.trim()) {
        return { text: fullText, model };
      }

      failures.push(`${model}: Empty streaming response content`);
    } catch (err) {
      failures.push(`${model}: ${err instanceof Error ? err.message : "Streaming failed"}`);
    }
  }

  throw new Error(`Gemini Streaming failed across all models. ${failures.join(" | ")}`);
}

/**
 * Enforces JSON schemas (`response_schema`) at the API level for structured outputs (quizzes, flashcards, diagnostic evaluation).
 */
export async function generateGeminiStructured<T>(
  options: GeminiOptions & { responseSchema: object },
): Promise<{ data: T; model: string }> {
  const result = await generateGeminiText({
    ...options,
    responseMimeType: "application/json",
    responseSchema: options.responseSchema,
  });

  try {
    const data = JSON.parse(result.text) as T;
    return { data, model: result.model };
  } catch (err) {
    throw new Error(`Failed to parse Gemini structured JSON output: ${err instanceof Error ? err.message : "Invalid JSON"}\nRaw output: ${result.text}`);
  }
}

