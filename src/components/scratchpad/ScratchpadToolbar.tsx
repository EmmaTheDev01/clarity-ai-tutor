import React from "react";
import {
  Pen,
  Feather,
  Highlighter,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  BrainCircuit,
  Grid,
  Check,
  Smartphone,
  Loader2,
} from "lucide-react";
import { ToolType, PaperStyle, PaperTheme } from "@/types/scratchpad";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const INK_COLORS = [
  { name: "Obsidian Ink", value: "#0f172a" },
  { name: "Classic Navy", value: "#1d4ed8" },
  { name: "Crimson Proof", value: "#dc2626" },
  { name: "Forest Green", value: "#15803d" },
  { name: "Royal Purple", value: "#7e22ce" },
  { name: "Vibrant Orange", value: "#ea580c" },
  { name: "Highlighter Lemon", value: "#eab308" },
  { name: "Highlighter Mint", value: "#22c55e" },
  { name: "Highlighter Sky", value: "#06b6d4" },
  { name: "Highlighter Coral", value: "#f43f5e" },
];

const STROKE_SIZES = [
  { label: "Fine", size: 2 },
  { label: "Medium", size: 4 },
  { label: "Broad", size: 7 },
  { label: "Marker", size: 14 },
];

// Shared sizing tokens — every button uses one of these so all items
// share the same 36px (h-9) height for a uniform, grid-aligned toolbar.
const iconBtn =
  "h-9 w-9 rounded-xl flex items-center justify-center transition-all shrink-0";
const pillBtn =
  "h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all shrink-0 min-w-[4.5rem]";

interface ScratchpadToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  currentSize: number;
  onSizeChange: (size: number) => void;
  paperStyle: PaperStyle;
  onPaperStyleChange: (style: PaperStyle) => void;
  paperTheme: PaperTheme;
  onPaperThemeChange: (theme: PaperTheme) => void;
  stylusOnly: boolean;
  onStylusOnlyChange: (enabled: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSynthesizeAI: () => void;
  isAnalyzing: boolean;
}

export function ScratchpadToolbar({
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  currentSize,
  onSizeChange,
  paperStyle,
  onPaperStyleChange,
  paperTheme,
  onPaperThemeChange,
  stylusOnly,
  onStylusOnlyChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onSynthesizeAI,
  isAnalyzing,
}: ScratchpadToolbarProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-nowrap items-center gap-1 p-1.5 bg-card/95 text-card-foreground backdrop-blur-xl border border-border/80 rounded-2xl shadow-xl transition-all max-w-fit overflow-x-auto">

        {/* Drawing Tools */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onToolChange("pen")}
                className={`${iconBtn} ${
                  currentTool === "pen"
                    ? "bg-primary text-primary-foreground shadow-sm scale-105"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Pen className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Ballpoint Pen (Pressure Adaptive)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onToolChange("calligraphy")}
                className={`${iconBtn} ${
                  currentTool === "calligraphy"
                    ? "bg-primary text-primary-foreground shadow-sm scale-105"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Feather className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Formula &amp; Calligraphy Pen (Angle &amp; Tilt)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onToolChange("highlighter")}
                className={`${iconBtn} ${
                  currentTool === "highlighter"
                    ? "bg-amber-500 text-white shadow-sm scale-105"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Highlighter className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Translucent Highlighter</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onToolChange("eraser")}
                className={`${iconBtn} ${
                  currentTool === "eraser"
                    ? "bg-destructive text-destructive-foreground shadow-sm scale-105"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Eraser className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Stroke Eraser</TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-border mx-0.5" />

        {/* Ink Color Picker */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`${iconBtn} border border-border hover:bg-muted`}
                >
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white/80 shadow-sm"
                    style={{ backgroundColor: currentColor }}
                  />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Ink Color</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-64 p-3 bg-popover text-popover-foreground border-border" align="start">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Ink Color</div>
            <div className="grid grid-cols-5 gap-2">
              {INK_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.name}
                  onClick={() => onColorChange(c.value)}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-border hover:scale-110 transition-transform shadow-xs"
                  style={{ backgroundColor: c.value }}
                >
                  {currentColor.toLowerCase() === c.value.toLowerCase() && (
                    <Check
                      className={`w-4 h-4 ${
                        ["#0f172a","#1d4ed8","#dc2626","#15803d","#7e22ce"].includes(c.value)
                          ? "text-white"
                          : "text-black"
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Stroke Thickness */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`${pillBtn} border border-border hover:bg-muted text-foreground`}
                >
                  <div
                    className="rounded-full bg-foreground shrink-0"
                    style={{
                      width: Math.min(12, Math.max(3, currentSize)),
                      height: Math.min(12, Math.max(3, currentSize)),
                    }}
                  />
                  <span className="truncate">
                    {STROKE_SIZES.find((s) => s.size === currentSize)?.label ?? `${currentSize}px`}
                  </span>
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Stroke Thickness</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-48 p-2.5 bg-popover text-popover-foreground border-border" align="start">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Stroke Thickness</div>
            <div className="flex flex-col gap-1">
              {STROKE_SIZES.map((s) => (
                <button
                  key={s.size}
                  type="button"
                  onClick={() => onSizeChange(s.size)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    currentSize === s.size
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <span>{s.label}</span>
                  <div className="rounded-full bg-current" style={{ width: s.size, height: s.size }} />
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border mx-0.5" />

        {/* Paper Style & Theme */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`${pillBtn} text-muted-foreground hover:text-foreground hover:bg-muted`}
                >
                  <Grid className="w-4 h-4 shrink-0" />
                  <span className="capitalize truncate">
                    {paperStyle === "grid" ? "Graph" : paperStyle}
                  </span>
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Paper Style &amp; Theme</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-64 p-3 bg-popover text-popover-foreground border-border" align="center">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Paper Style</div>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {(["grid", "ruled", "dots", "blank"] as PaperStyle[]).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => onPaperStyleChange(style)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs capitalize font-medium transition-all ${
                    paperStyle === style
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {style === "grid" ? "Math Graph" : style}
                </button>
              ))}
            </div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">Paper Theme</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "light", label: "Clean White" },
                { id: "dark", label: "Dark Slate" },
                { id: "sepia", label: "Parchment" },
                { id: "yellow_pad", label: "Legal Pad" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onPaperThemeChange(t.id as PaperTheme)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    paperTheme === t.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Palm Rejection Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onStylusOnlyChange(!stylusOnly)}
              className={`${iconBtn} ${
                stylusOnly
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {stylusOnly
              ? "Palm Rejection Active — only Apple Pencil / S-Pen draws"
              : "Stylus & Touch Active — fingers and pens can both draw"}
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-0.5" />

        {/* Undo / Redo / Clear */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={!canUndo}
                onClick={onUndo}
                className={`${iconBtn} text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none`}
              >
                <Undo2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Undo Stroke</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={!canRedo}
                onClick={onRedo}
                className={`${iconBtn} text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none`}
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Redo Stroke</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onClear}
                className={`${iconBtn} text-destructive hover:bg-destructive/10`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Clear Sheet</TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-border mx-0.5" />

        {/* AI Brainstorm */}
        <button
          type="button"
          disabled={isAnalyzing}
          onClick={onSynthesizeAI}
          className="h-9 px-4 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:opacity-90 shadow-sm active:scale-95 transition-all disabled:opacity-50 shrink-0"
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          ) : (
            <BrainCircuit className="w-4 h-4 shrink-0" />
          )}
          <span>{isAnalyzing ? "Analyzing…" : "Brainstorm"}</span>
        </button>

      </div>
    </TooltipProvider>
  );
}
