import { Point, Stroke, ToolType, PaperStyle, PaperTheme } from "@/types/scratchpad";

export interface DrawContextOptions {
  ctx: CanvasRenderingContext2D;
  dpr: number;
}

/**
 * Returns theme colors for the canvas background and grid patterns.
 */
export function getPaperThemeColors(theme: PaperTheme) {
  switch (theme) {
    case "dark":
      return {
        bg: "#0f172a",
        grid: "rgba(148, 163, 184, 0.12)",
        margin: "rgba(244, 63, 94, 0.25)",
        defaultInk: "#f8fafc",
      };
    case "yellow_pad":
      return {
        bg: "#fef9c3",
        grid: "rgba(180, 83, 9, 0.15)",
        margin: "rgba(220, 38, 38, 0.35)",
        defaultInk: "#1e293b",
      };
    case "sepia":
      return {
        bg: "#f7f1e5",
        grid: "rgba(120, 113, 108, 0.18)",
        margin: "rgba(194, 65, 12, 0.3)",
        defaultInk: "#292524",
      };
    case "light":
    default:
      return {
        bg: "#ffffff",
        grid: "rgba(148, 163, 184, 0.22)",
        margin: "rgba(239, 68, 68, 0.35)",
        defaultInk: "#0f172a",
      };
  }
}

/**
 * Renders paper patterns (grid, ruled, dots, or blank) onto the background canvas.
 */
export function drawPaperBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: PaperStyle,
  theme: PaperTheme,
) {
  const colors = getPaperThemeColors(theme);

  // 1. Fill base paper background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  if (style === "blank") return;

  ctx.save();

  if (style === "grid") {
    const spacing = 28;
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = spacing; x < width; x += spacing) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
    }
    for (let y = spacing; y < height; y += spacing) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
    }
    ctx.stroke();
  } else if (style === "ruled") {
    const lineSpacing = 34;
    const topMargin = 50;
    const leftMargin = 64;

    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let y = topMargin; y < height; y += lineSpacing) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
    }
    ctx.stroke();

    // Red vertical margin rule
    ctx.strokeStyle = colors.margin;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(leftMargin + 0.5, 0);
    ctx.lineTo(leftMargin + 0.5, height);
    ctx.stroke();
  } else if (style === "dots") {
    const spacing = 26;
    ctx.fillStyle = colors.grid.replace("0.22", "0.45").replace("0.12", "0.35");
    const radius = 1.2;

    for (let x = spacing; x < width; x += spacing) {
      for (let y = spacing; y < height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

/**
 * Calculates dynamic line width based on tool and pressure.
 * Emulates Apple Pencil / S-Pen responsive ink.
 */
export function getDynamicStrokeWidth(
  baseSize: number,
  tool: ToolType,
  pressure: number,
  tiltX = 0,
  tiltY = 0,
  angle = 0,
): number {
  const normPressure = Math.max(0.1, Math.min(1.0, pressure || 0.5));

  switch (tool) {
    case "pen":
      // Smooth pressure curve: lighter touch gives delicate fine lines, firm press gives bold ink
      return baseSize * (0.35 + 0.95 * normPressure);

    case "calligraphy": {
      // Calligraphy math pen: downstrokes are thick, horizontal crossbars are fine
      const angleWeight = Math.abs(Math.sin(angle));
      const tiltFactor = Math.hypot(tiltX, tiltY) > 0 ? 1 + (Math.abs(tiltY) / 90) * 0.5 : 1;
      return baseSize * (0.4 + 0.8 * angleWeight + 0.4 * normPressure) * tiltFactor;
    }

    case "highlighter":
      // Highlighters have a broad chisel tip with constant width
      return baseSize * 2.8;

    case "eraser":
      return baseSize * 2.5;

    default:
      return baseSize;
  }
}

/**
 * Draws a single stroke using smooth midpoint Bézier curves.
 */
export function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const points = stroke.points;
  if (!points || points.length === 0) return;

  ctx.save();
  ctx.lineCap = stroke.tool === "highlighter" ? "square" : "round";
  ctx.lineJoin = stroke.tool === "highlighter" ? "bevel" : "round";

  if (stroke.tool === "highlighter") {
    ctx.globalAlpha = 0.38;
    ctx.globalCompositeOperation = "multiply";
  } else {
    ctx.globalAlpha = stroke.opacity ?? 1.0;
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.strokeStyle = stroke.color;

  if (points.length === 1) {
    // Single dot or tap
    const p = points[0];
    const r = getDynamicStrokeWidth(stroke.size, stroke.tool, p.pressure) / 2;
    ctx.fillStyle = stroke.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(1, r), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Draw segment-by-segment with dynamic width for Apple Pencil pressure dynamics
  if (stroke.tool === "pen" || stroke.tool === "calligraphy") {
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];

      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const angle = Math.atan2(dy, dx);
      const avgPressure = (p0.pressure + p1.pressure) / 2;
      const width = getDynamicStrokeWidth(
        stroke.size,
        stroke.tool,
        avgPressure,
        p1.tiltX,
        p1.tiltY,
        angle,
      );

      ctx.lineWidth = Math.max(0.5, width);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
  } else {
    // Constant width Bézier spline for highlighter and eraser
    ctx.lineWidth = getDynamicStrokeWidth(stroke.size, stroke.tool, 0.5);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }

    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Checks if a point hits any segment of a stroke within a distance threshold.
 * Used for instant "Stroke Eraser" (erasing the whole stroke on touch).
 */
export function isPointNearStroke(
  point: { x: number; y: number },
  stroke: Stroke,
  threshold = 12,
): boolean {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return false;

  const hitRadius = Math.max(threshold, stroke.size);

  for (let i = 0; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - point.x, pts[i].y - point.y);
    if (d <= hitRadius) return true;
  }

  // Also test segment distance
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];

    const lineLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (lineLen === 0) continue;

    const u =
      ((point.x - p1.x) * (p2.x - p1.x) + (point.y - p1.y) * (p2.y - p1.y)) /
      (lineLen * lineLen);

    if (u >= 0 && u <= 1) {
      const projX = p1.x + u * (p2.x - p1.x);
      const projY = p1.y + u * (p2.y - p1.y);
      if (Math.hypot(point.x - projX, point.y - projY) <= hitRadius) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Exports strokes to a clean image data URL for AI Vision and thumbnails.
 */
export function exportStrokesToImage(
  strokes: Stroke[],
  width: number,
  height: number,
  options?: {
    background?: string;
    scale?: number;
    mimeType?: string;
    quality?: number;
  },
): string {
  if (typeof document === "undefined") return "";

  const scale = options?.scale ?? 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(100, width * scale);
  canvas.height = Math.max(100, height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Always fill clean white background for optimal OCR & AI Vision contrast
  ctx.fillStyle = options?.background ?? "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.scale(scale, scale);

  // Draw all strokes
  for (const stroke of strokes) {
    drawStroke(ctx, stroke);
  }

  return canvas.toDataURL(options?.mimeType ?? "image/jpeg", options?.quality ?? 0.88);
}
