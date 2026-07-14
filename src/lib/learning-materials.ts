import { FileText, File, Image, Link, Mic, Presentation, Video, Youtube } from "lucide-react";
import { supabase } from "@/lib/supabase";

export type MaterialType =
  "PDF" | "Word" | "Image" | "Slides" | "Audio" | "Video" | "YouTube" | "Link" | "Text" | "File";

export type LearningMaterial = {
  id: string;
  title: string;
  type: MaterialType;
  size: string;
  updated: string;
  url?: string | null;
  content?: string | null;
  storagePath?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  icon: typeof FileText;
  pinned?: boolean;
};

type MaterialRow = {
  id: string;
  title: string;
  type?: string | null;
  material_type?: string | null;
  url?: string | null;
  content?: string | null;
  storage_path?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  updated_at?: string | null;
  created_at?: string | null;
  pinned?: boolean | null;
};

const readableBytes = (bytes?: number | null) => {
  if (!bytes) return "Linked source";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const PINNED_MATERIALS_STORAGE_KEY = "clarity_material_pins";

const getPinnedMaterialIds = (): string[] => {
  if (typeof window === "undefined" || !window.localStorage) return [];
  const raw = window.localStorage.getItem(PINNED_MATERIALS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const setPinnedMaterialIds = (ids: string[]) => {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(PINNED_MATERIALS_STORAGE_KEY, JSON.stringify(ids));
};

export const getMaterialIcon = (type?: string) => {
  if (type === "YouTube") return Youtube;
  if (type === "Slides") return Presentation;
  if (type === "Audio") return Mic;
  if (type === "Video") return Video;
  if (type === "Image") return Image;
  if (type === "Link") return Link;
  if (type === "Word" || type === "File") return File;
  return FileText;
};

export const detectMaterialType = (input: {
  file?: File;
  link?: string;
  content?: string;
}): MaterialType => {
  const file = input.file;
  const link = input.link?.trim().toLowerCase();

  if (link) {
    if (link.includes("youtube.com") || link.includes("youtu.be")) return "YouTube";
    return "Link";
  }

  if (!file) return input.content?.trim() ? "Text" : "File";

  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  if (mime.includes("pdf") || name.endsWith(".pdf")) return "PDF";
  if (mime.includes("word") || name.endsWith(".doc") || name.endsWith(".docx")) return "Word";
  if (mime.startsWith("image/")) return "Image";
  if (mime.startsWith("audio/")) return "Audio";
  if (mime.startsWith("video/")) return "Video";
  if (mime.includes("presentation") || name.endsWith(".ppt") || name.endsWith(".pptx"))
    return "Slides";
  if (mime.startsWith("text/") || name.endsWith(".md") || name.endsWith(".txt")) return "Text";
  return "File";
};

export const mapMaterialRow = (item: MaterialRow): LearningMaterial => {
  const type = (item.type || item.material_type || "File") as MaterialType;
  const pinnedIds = getPinnedMaterialIds();
  return {
    id: item.id,
    title: item.title,
    type,
    size: item.file_size
      ? readableBytes(item.file_size)
      : item.url
        ? "Linked source"
        : "Text material",
    updated: new Date(item.updated_at || item.created_at || Date.now()).toLocaleDateString(),
    url: item.url,
    content: item.content,
    storagePath: item.storage_path,
    mimeType: item.mime_type,
    fileSize: item.file_size,
    icon: getMaterialIcon(type),
    pinned: typeof item.pinned === "boolean" ? item.pinned : pinnedIds.includes(item.id),
  };
};

export async function renameMaterial(id: string, title: string) {
  const { error } = await supabase.from("materials").update({ title }).eq("id", id);
  if (error) throw error;
  return true;
}

export async function deleteMaterial(id: string) {
  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function togglePinMaterial(id: string, pinned: boolean) {
  try {
    const { error } = await supabase.from("materials").update({ pinned }).eq("id", id);
    if (error) {
      const message = error.message || "";
      if (message.includes("pinned") || message.includes("column")) {
        const pinnedIds = getPinnedMaterialIds();
        const nextIds = pinned ? [...new Set([...pinnedIds, id])] : pinnedIds.filter((itemId) => itemId !== id);
        setPinnedMaterialIds(nextIds);
        return false;
      }
      throw error;
    }
    const pinnedIds = getPinnedMaterialIds();
    const nextIds = pinned ? [...new Set([...pinnedIds, id])] : pinnedIds.filter((itemId) => itemId !== id);
    setPinnedMaterialIds(nextIds);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("pinned") || message.includes("column")) {
      const pinnedIds = getPinnedMaterialIds();
      const nextIds = pinned ? [...new Set([...pinnedIds, id])] : pinnedIds.filter((itemId) => itemId !== id);
      setPinnedMaterialIds(nextIds);
      return false;
    }
    throw error;
  }
}

export async function createGeneralChatMaterial() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) throw new Error("Please sign in before chatting.");

  const { data: existing } = await supabase
    .from("materials")
    .select("*")
    .eq("title", "General Chat")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return mapMaterialRow(existing);

  const { data, error } = await supabase
    .from("materials")
    .insert({
      title: "General Chat",
      type: "Text",
      content: "General chat workspace",
      uploaded_by: authData.user.id,
      source_kind: "text",
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapMaterialRow(data);
}

export async function createNewChatSession(title?: string) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) throw new Error("Please sign in before starting a new chat.");

  const finalTitle = title?.trim() || `General Chat (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`;

  const { data, error } = await supabase
    .from("materials")
    .insert({
      title: finalTitle,
      type: "Text",
      content: "General chat workspace",
      uploaded_by: authData.user.id,
      source_kind: "text",
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapMaterialRow(data);
}

import { generateGeminiText, generateGeminiMultimodal } from "./gemini";

const cleanFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

export async function uploadLearningMaterial({
  file,
  link,
  title,
  content,
}: {
  file?: File | null;
  link?: string;
  title?: string;
  content?: string;
}) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) throw new Error("Please sign in before adding study material.");

  const type = detectMaterialType({ file: file || undefined, link, content });
  const normalizedTitle = title?.trim() || file?.name || link?.trim() || "Untitled study material";
  let storagePath: string | null = null;
  let publicUrl: string | null = link?.trim() || null;

  if (file) {
    storagePath = `${authData.user.id}/${Date.now()}-${cleanFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("study-files")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("study-files").getPublicUrl(storagePath);
    publicUrl = data.publicUrl;
  }

  // AI-assisted study guide/notes extraction
  let extractedContent = content?.trim() || null;

  try {
      if (file) {
        if (
          file.type.startsWith("text/") ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".md")
        ) {
          extractedContent = await file.text();
        } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          const base64 = await fileToBase64(file);
          const prompt = `You are a world-class professor creating comprehensive lecture notes from a PDF document.

## YOUR TASK:
Produce **extensive, richly formatted study notes** from this PDF that a university student can use to deeply understand and master the material.

## STRUCTURE YOUR OUTPUT AS FOLLOWS:

### 1. Overview & Big Picture
Begin with a high-level summary of what this document covers and why it matters. Use *italics* for key themes and **bold** for the most important ideas.

### 2. Core Theory & Concepts
For each major concept or topic in the document:
- Explain the **theory and underlying principles** in depth — the *why* before the *how*.
- Define all key terms in **bold** when first introduced.
- Use headings (\`## Topic\`, \`### Subtopic\`) to organize sections logically.

### 3. Formulas, Equations & Definitions
Present all relevant formulas and formal definitions in clearly labeled blocks. Explain every symbol and variable.

### 4. Key Examples & Applications
Walk through illustrative examples from the document. Explain the reasoning step-by-step.

### 5. Summary & Key Takeaways
End with a bulleted list of the most important things to remember from this document.

Use clean markdown formatting throughout. Be thorough — these notes should leave nothing important unexplained.`;
          const result = await generateGeminiMultimodal(prompt, base64, "application/pdf", 4096);
          extractedContent = result.text;
        } else if (file.type.startsWith("image/")) {
          const base64 = await fileToBase64(file);
          const prompt = `You are a world-class professor analysing an image or diagram.

## YOUR TASK:
Generate **extensive, richly formatted study notes** that help a student deeply understand everything in this image.

## STRUCTURE YOUR OUTPUT AS FOLLOWS:

### 1. What This Shows — Big Picture
Describe what the image or diagram represents and why it is significant. Use **bold** for key concepts and *italics* for emphasis.

### 2. Theory Behind the Visual
Explain the *underlying theory or concept* this image is illustrating. Go deep — do not just describe what is visible; explain what it *means*.

### 3. Key Terms & Definitions
List and define every important term, label, or symbol visible in the image. Use **bold** for each term.

### 4. Step-by-Step Walkthrough
Walk through the image in logical order, explaining each component or step in a narrative teaching voice.

### 5. Real-World Connections & Applications
Where and how is this concept or diagram used in practice?

Use clean markdown formatting throughout.`;
          const result = await generateGeminiMultimodal(prompt, base64, file.type, 3000);
          extractedContent = result.text;
        } else if (file.type.startsWith("audio/")) {
          const base64 = await fileToBase64(file);
          const prompt = `You are a world-class professor creating lecture notes from an audio recording.

## YOUR TASK:
Produce **extensive, richly formatted study notes** based on the content of this audio.

## STRUCTURE YOUR OUTPUT AS FOLLOWS:

### 1. Overview
What is this audio about? What are the main themes? Use **bold** for core topics and *italics* for emphasis.

### 2. Core Theory & Ideas
For each major idea or topic discussed in the audio:
- Explain the **theory** in depth — the *why* before the *how*.
- Define key terms in **bold** when first introduced.
- Use headings to separate distinct topics.

### 3. Formulas, Equations & Definitions
If any are mentioned or implied, present them clearly with explanations of every symbol.

### 4. Examples & Illustrations
Summarize any examples, stories, or case studies used in the audio.

### 5. Key Takeaways
A bulleted list of the most important things to remember.

Use clean markdown formatting throughout. Be thorough.`;
          const result = await generateGeminiMultimodal(prompt, base64, file.type, 3000);
          extractedContent = result.text;
        } else if (file.type.startsWith("video/")) {
          const base64 = await fileToBase64(file);
          const prompt = `You are a world-class professor creating lecture notes from a video clip.

## YOUR TASK:
Generate **extensive, richly formatted study notes** from this video's content.

## STRUCTURE YOUR OUTPUT AS FOLLOWS:

### 1. Overview & Context
What does this video cover? What is the main educational purpose? Use **bold** for key topics and *italics* for critical ideas.

### 2. Core Theory & Concepts
For each concept covered:
- Explain the **underlying theory** — the *why* before the *how*.
- Define all key terms in **bold** on first use.
- Organize with clear headings and subheadings.

### 3. Formulas, Equations & Definitions
List and explain any formulas, equations, or formal definitions clearly.

### 4. Visual Elements & Demonstrations
Describe and explain any visual demonstrations, diagrams, or worked examples shown in the video.

### 5. Summary & Takeaways
A concise bulleted summary of the most important learnings.

Use clean markdown formatting throughout. Be as thorough as possible.`;
          const result = await generateGeminiMultimodal(prompt, base64, file.type, 3000);
          extractedContent = result.text;
        }
      } else if (link) {
        const prompt = `You are a world-class professor creating comprehensive study notes from a web resource.

**Resource URL:** ${link}
**Resource Title:** ${normalizedTitle}

## YOUR TASK:
Produce **extensive, richly formatted study notes** that a university student can use to deeply understand the content at this link.

## STRUCTURE YOUR OUTPUT AS FOLLOWS:

### 1. Overview & Big Picture
What is this resource about? Why does it matter? Use **bold** for core topics and *italics* for emphasis.

### 2. Core Theory & Concepts
For each major idea from the resource:
- Explain the **theory and underlying principles** — *why* before *how*.
- Define key terms in **bold** when first introduced.
- Use markdown headings to organize sections clearly.

### 3. Formulas, Equations & Definitions
Present any relevant formulas or definitions clearly with full symbol explanations.

### 4. Examples & Applications
Walk through key examples or use cases from the resource.

### 5. Summary & Takeaways
A bulleted list of the most important things to remember.

Use clean, beautiful markdown formatting throughout. Be thorough.`;
        const result = await generateGeminiText(prompt, 3000);
        extractedContent = result.text;
      }
  } catch (err) {
    console.warn("AI text extraction failed during upload, proceeding with default content:", err);
  }

  const { data, error } = await supabase
    .from("materials")
    .insert({
      title: normalizedTitle,
      type,
      url: publicUrl,
      content: extractedContent,
      storage_path: storagePath,
      mime_type: file?.type || null,
      file_size: file?.size || null,
      uploaded_by: authData.user.id,
      source_kind: file ? "file" : link?.trim() ? "link" : "text",
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapMaterialRow(data);
}
