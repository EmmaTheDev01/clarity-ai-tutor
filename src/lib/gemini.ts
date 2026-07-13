const configuredModel = import.meta.env.VITE_GEMINI_MODEL?.trim();

export const geminiModel = configuredModel || "gemini-flash-latest";

const fallbackModels = ["gemini-flash-latest", "gemini-flash-latest"];

const getGeminiError = (payload: unknown, fallback: string) => {
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

export async function generateGeminiText(prompt: string, maxOutputTokens = 2048) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY in .env. Restart the dev server after adding it.");
  }

  const models = [geminiModel, ...fallbackModels.filter((model) => model !== geminiModel)];
  const failures: string[] = [];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens,
            },
          }),
        },
      );

      const data = await response.json().catch(() => ({}));
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (response.ok && text) {
        return { text, model };
      }

      failures.push(`${model}: ${getGeminiError(data, "Gemini returned no text.")}`);
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
) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY in .env. Restart the dev server after adding it.");
  }

  const models = [geminiModel, ...fallbackModels.filter((model) => model !== geminiModel)];
  const failures: string[] = [];

  for (const model of models) {
    try {
      const imageParts = typeof images === "string"
        ? [{ inlineData: { mimeType: mimeType || "image/jpeg", data: images } }]
        : images.map((img) => ({ inlineData: { mimeType: img.mimeType, data: img.base64 } }));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  ...imageParts,
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens,
            },
          }),
        },
      );

      const data = await response.json().catch(() => ({}));
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (response.ok && text) {
        return { text, model };
      }

      failures.push(`${model}: ${getGeminiError(data, "Gemini returned no text.")}`);
    } catch (err) {
      failures.push(`${model}: ${err instanceof Error ? err.message : "Network request failed."}`);
    }
  }

  throw new Error(`Gemini did not respond. ${failures.join(" | ")}`);
}

