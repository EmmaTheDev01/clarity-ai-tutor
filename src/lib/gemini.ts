import { supabase } from "@/lib/supabase";

const configuredModel = import.meta.env.VITE_GEMINI_MODEL?.trim();

export const geminiModel = configuredModel || "gemini-2.5-flash";

const fallbackModels = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.5-flash-lite"];

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
 * Fetches the system API key asynchronously from Supabase `system_settings` table.
 */
export async function fetchSystemApiKeyFromDb(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "gemini_api_key")
      .maybeSingle();

    if (!error && data?.value) {
      cachedDbApiKey = data.value.trim();
      if (typeof localStorage !== "undefined" && cachedDbApiKey) {
        localStorage.setItem("system_gemini_api_key", cachedDbApiKey);
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

/**
 * Fetch wrapper with exponential backoff and randomized jitter for 429 and transient errors.
 */
async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  retries = 3,
  initialDelayMs = 1000,
): Promise<Response> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      // Rate limit or server error: retry
      if ((response.status === 429 || response.status >= 500) && attempt < retries) {
        attempt++;
        const jitter = Math.random() * 500;
        const delay = initialDelayMs * Math.pow(2, attempt - 1) + jitter;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (err) {
      if (attempt < retries) {
        attempt++;
        const jitter = Math.random() * 500;
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

  if (options.systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
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

  const models = Array.from(new Set([geminiModel, ...fallbackModels]));
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

  const models = Array.from(new Set([geminiModel, ...fallbackModels]));
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

