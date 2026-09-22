export type Point = {
  x: number;
  y: number;
  pressure: number;
  tiltX?: number;
  tiltY?: number;
  time: number;
};

export type ToolType = "pen" | "calligraphy" | "highlighter" | "eraser";

export type Stroke = {
  id: string;
  tool: ToolType;
  color: string;
  size: number;
  opacity: number;
  points: Point[];
};

export type PaperStyle = "blank" | "ruled" | "grid" | "dots";
export type PaperTheme = "light" | "dark" | "yellow_pad" | "sepia";

export type SocraticStudyGuide = {
  title: string;
  detectedSubject?: string;
  summary: string;
  identifiedFormulas: {
    latex: string;
    description: string;
  }[];
  keyConcepts: {
    concept: string;
    explanation: string;
    realWorldAnalogy: string;
  }[];
  socraticQuestions: {
    question: string;
    hint: string;
    deeperThinking: string;
  }[];
  errorCheckOrRefinements: string[];
  rewardMessage: string;
  xpEarned: number;
};

export type Scratchpad = {
  id: string;
  student_id: string;
  title: string;
  subject: string;
  strokes_data: Stroke[];
  thumbnail_url?: string;
  paper_style: PaperStyle;
  paper_theme: PaperTheme;
  ai_analysis?: SocraticStudyGuide;
  linked_note_id?: string;
  created_at: string;
  updated_at: string;
};
