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
  };
};

const cleanFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");

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

  const { data, error } = await supabase
    .from("materials")
    .insert({
      title: normalizedTitle,
      type,
      url: publicUrl,
      content: content?.trim() || null,
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
