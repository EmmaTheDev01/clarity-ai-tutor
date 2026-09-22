import { useRef, useEffect, useCallback } from "react";
import { Point, Stroke, ToolType, PaperStyle, PaperTheme } from "@/types/scratchpad";
import {
  drawPaperBackground,
  drawStroke,
  isPointNearStroke,
  getDynamicStrokeWidth,
} from "@/lib/scratchpad-engine";

interface ScratchpadCanvasProps {
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
  currentTool: ToolType;
  currentColor: string;
  currentSize: number;
  paperStyle: PaperStyle;
  paperTheme: PaperTheme;
  stylusOnly: boolean;
  onStrokeStart?: () => void;
  onStrokeEnd?: () => void;
  className?: string;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export function ScratchpadCanvas({
  strokes,
  onStrokesChange,
  currentTool,
  currentColor,
  currentSize,
  paperStyle,
  paperTheme,
  stylusOnly,
  onStrokeStart,
  onStrokeEnd,
  className,
  canvasRef: externalCanvasRef,
}: ScratchpadCanvasProps) {
  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const isDrawingRef = useRef(false);
  const activeStrokeRef = useRef<Stroke | null>(null);

  // Redraw all background paper patterns and strokes
  const renderAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    // Clear and draw paper texture
    drawPaperBackground(ctx, width, height, paperStyle, paperTheme);

    // Draw all committed strokes
    for (const stroke of strokes) {
      drawStroke(ctx, stroke);
    }

    // Draw the currently active stroke if any
    if (activeStrokeRef.current) {
      drawStroke(ctx, activeStrokeRef.current);
    }
    ctx.restore();
  }, [canvasRef, strokes, paperStyle, paperTheme]);

  // Adjust canvas size to parent container with Retina/HiDPI display support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      renderAll();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [canvasRef, renderAll]);

  // Trigger redraw whenever strokes or paper settings change
  useEffect(() => {
    renderAll();
  }, [renderAll]);

  // Helper to get normalized canvas coordinate
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5, time: Date.now() };

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.x;
    const y = e.clientY - rect.y;
    // Normalized pressure: default to 0.5 if not supported
    const pressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5;

    return {
      x,
      y,
      pressure,
      tiltX: e.tiltX,
      tiltY: e.tiltY,
      time: Date.now(),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Palm rejection: If stylusOnly mode is active and pointer is a finger touch, ignore it!
    if (stylusOnly && e.pointerType === "touch") {
      return;
    }

    // Capture pointer events so strokes don't drop off edges
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // Ignore in test environments
    }

    const startPoint = getCanvasPoint(e);
    isDrawingRef.current = true;

    if (currentTool === "eraser") {
      // Stroke eraser: Check if any existing stroke was touched and remove it
      const remainingStrokes = strokes.filter(
        (s) => !isPointNearStroke(startPoint, s, currentSize * 2.5),
      );
      if (remainingStrokes.length !== strokes.length) {
        onStrokesChange(remainingStrokes);
      }
      return;
    }

    onStrokeStart?.();

    const newStroke: Stroke = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tool: currentTool,
      color: currentColor,
      size: currentSize,
      opacity: currentTool === "highlighter" ? 0.38 : 1.0,
      points: [startPoint],
    };

    activeStrokeRef.current = newStroke;
    renderAll();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    if (stylusOnly && e.pointerType === "touch") return;

    // iPad Pro / Apple Pencil coalesced events sampling (captures up to 240Hz sub-pixel inputs)
    const nativeEvent = e.nativeEvent as PointerEvent;
    const coalesced = nativeEvent.getCoalescedEvents
      ? nativeEvent.getCoalescedEvents()
      : [nativeEvent];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (currentTool === "eraser") {
      let currentRemaining = [...strokes];
      let hasErased = false;

      for (const cev of coalesced) {
        const pt = {
          x: cev.clientX - rect.x,
          y: cev.clientY - rect.y,
        };
        const updated = currentRemaining.filter(
          (s) => !isPointNearStroke(pt, s, currentSize * 2.5),
        );
        if (updated.length !== currentRemaining.length) {
          currentRemaining = updated;
          hasErased = true;
        }
      }

      if (hasErased) {
        onStrokesChange(currentRemaining);
      }
      return;
    }

    if (!activeStrokeRef.current) return;

    for (const cev of coalesced) {
      const pressure = cev.pressure !== undefined && cev.pressure > 0 ? cev.pressure : 0.5;
      activeStrokeRef.current.points.push({
        x: cev.clientX - rect.x,
        y: cev.clientY - rect.y,
        pressure,
        tiltX: cev.tiltX,
        tiltY: cev.tiltY,
        time: Date.now(),
      });
    }

    renderAll();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (err) {
      // Ignore
    }

    if (activeStrokeRef.current && activeStrokeRef.current.points.length > 0) {
      const finishedStroke = activeStrokeRef.current;
      activeStrokeRef.current = null;
      onStrokesChange([...strokes, finishedStroke]);
      onStrokeEnd?.();
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden select-none touch-none ${className || ""}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair touch-none select-none block"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
