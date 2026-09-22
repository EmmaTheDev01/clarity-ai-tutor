import { generateGeminiStructured } from "@/lib/gemini";
import { SocraticStudyGuide } from "@/types/scratchpad";
import { supabase } from "@/lib/supabase";
import { triggerCelebration } from "@/lib/celebration";
import { toast } from "sonner";

const SOCRATIC_STUDY_GUIDE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: {
      type: "STRING",
      description: "A concise, engaging title for the handwritten topic or problem (e.g., 'Integration by Parts & Trigonometric Substitution').",
    },
    detectedSubject: {
      type: "STRING",
      description: "The automatically recognized academic domain or subject (e.g., 'Mathematics', 'Calculus', 'Organic Chemistry', 'Classical Physics', 'Computer Science', 'World History', etc.).",
    },
    summary: {
      type: "STRING",
      description: "A clear, encouraging 2-3 sentence overview of what the student is writing or solving.",
    },
    identifiedFormulas: {
      type: "ARRAY",
      description: "All identified mathematical, physics, chemistry, or scientific formulas converted accurately to standard LaTeX ($$...$$).",
      items: {
        type: "OBJECT",
        properties: {
          latex: {
            type: "STRING",
            description: "Strict standard LaTeX formula without surrounding markdown, e.g. '\\int x e^x dx = x e^x - e^x + C'.",
          },
          description: {
            type: "STRING",
            description: "What this formula represents and how it operates.",
          },
        },
        required: ["latex", "description"],
      },
    },
    keyConcepts: {
      type: "ARRAY",
      description: "Key principles and definitions underlying the student's handwritten work.",
      items: {
        type: "OBJECT",
        properties: {
          concept: { type: "STRING" },
          explanation: { type: "STRING" },
          realWorldAnalogy: {
            type: "STRING",
            description: "An intuitive real-world mental model or analogy to make this memorable.",
          },
        },
        required: ["concept", "explanation", "realWorldAnalogy"],
      },
    },
    socraticQuestions: {
      type: "ARRAY",
      description: "2 to 3 thought-provoking Socratic questions that guide deeper learning instead of just giving answers.",
      items: {
        type: "OBJECT",
        properties: {
          question: { type: "STRING" },
          hint: { type: "STRING" },
          deeperThinking: { type: "STRING" },
        },
        required: ["question", "hint", "deeperThinking"],
      },
    },
    errorCheckOrRefinements: {
      type: "ARRAY",
      description: "Constructive observations or potential errors detected in the handwriting (e.g., dropped negative signs, algebra slips, or clarity improvements). Keep tone extremely empowering.",
      items: { type: "STRING" },
    },
    rewardMessage: {
      type: "STRING",
      description: "An empowering, motivating message praising their deep thinking and curiosity.",
    },
    xpEarned: {
      type: "INTEGER",
      description: "Amount of XP awarded for this study session (between 40 and 80).",
    },
  },
  required: [
    "title",
    "summary",
    "identifiedFormulas",
    "keyConcepts",
    "socraticQuestions",
    "rewardMessage",
    "xpEarned",
  ],
};

const SOCRATIC_SCRATCHPAD_PROMPT = `You are PureLearn AI, the elite Socratic tutor with advanced vision intelligence.
Analyze the student's handwritten notes, formulas, calculations, or sketches from their digital tablet scratchpad.

CORE PEDAGOGICAL OBJECTIVES:
1. FORMULA & HANDWRITING OCR: Accurately decode handwritten math, physics, or chemistry equations into pristine KaTeX/LaTeX formatting.
2. SOCRATIC CONCEPTUAL BREAKDOWN: Identify the core ideas. Don't just lecture; explain WHY the concepts work and provide intuitive real-world mental models.
3. CONSTRUCTIVE GUIDANCE: If there's an error, missing constant (like + C in integrals), algebraic sign slip, or unclear step, do NOT say "You failed". Instead, gently highlight it Socratically: "Take a close look at your exponent in step 2: what happens when...?"
4. SOCRATIC PROMPTS: Offer 2-3 guided questions that encourage the student to discover deeper connections.
5. CELEBRATION & REWARD: Award between 50 and 75 XP and provide an empowering reward message praising their proactive note-taking and handwritten problem-solving.`;

/**
 * Sends the scratchpad canvas image to Gemini 2.5 Flash for multimodal Socratic synthesis.
 */
export async function analyzeScratchpadWithAI(params: {
  imageBase64: string;
  scratchpadTitle?: string;
}): Promise<SocraticStudyGuide> {
  // Strip potential data URL prefix
  const cleanBase64 = params.imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const userPrompt = `Please inspect this handwritten tablet scratchpad.
Working Title: ${params.scratchpadTitle || "Handwritten Scratchpad"}

REQUIREMENT: Automatically recognize the academic subject/domain (e.g. Calculus, Physics, Chemistry, Biology, Computer Science, Literature, Engineering, etc.) directly from the handwriting and drawings.

Transcribe all mathematical symbols and handwritten equations into pristine LaTeX ($$...$$), deconstruct the core concepts Socratically, check for any calculation missteps with empowering guidance, and generate a world-class study guide.`;

  const { data } = await generateGeminiStructured<SocraticStudyGuide>({
    prompt: userPrompt,
    images: cleanBase64,
    mimeType: "image/jpeg",
    systemInstruction: SOCRATIC_SCRATCHPAD_PROMPT,
    responseSchema: SOCRATIC_STUDY_GUIDE_SCHEMA,
    temperature: 0.3,
    maxOutputTokens: 2500,
  });

  // Award celebration and confetti
  try {
    triggerCelebration({ particleCount: 75, durationMs: 2500, playChime: true });
  } catch (e) {
    // ignore
  }

  // Update user's profile XP asynchronously
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    if (userId && data.xpEarned) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp")
        .eq("id", userId)
        .maybeSingle();

      if (profile) {
        const currentXp = profile.xp || 0;
        await supabase
          .from("profiles")
          .update({ xp: currentXp + data.xpEarned })
          .eq("id", userId);
      }
    }
  } catch (err) {
    console.debug("[ScratchpadAI] Could not update profile XP:", err);
  }

  return data;
}

/**
 * Converts or syncs a Socratic Study Guide into a permanent note in `public.notes`.
 * If an existing note is already linked to this scratchpad, updates it in-place!
 */
export async function convertStudyGuideToNote(params: {
  studyGuide: SocraticStudyGuide;
  subject?: string;
  thumbnailUrl?: string;
  scratchpadId?: string;
  existingNoteId?: string;
}): Promise<{ noteId: string }> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error("You must be signed in to save notes.");
  }

  const { studyGuide, subject, thumbnailUrl, scratchpadId, existingNoteId } = params;
  const resolvedSubject = studyGuide.detectedSubject || subject || "General";

  // Build high quality structured Markdown content
  let markdown = `## Summary\n\n${studyGuide.summary}\n\n`;

  if (studyGuide.identifiedFormulas && studyGuide.identifiedFormulas.length > 0) {
    markdown += `### Key Formulas & Expressions\n\n`;
    for (const f of studyGuide.identifiedFormulas) {
      markdown += `$$\n${f.latex}\n$$\n*${f.description}*\n\n`;
    }
  }

  if (studyGuide.keyConcepts && studyGuide.keyConcepts.length > 0) {
    markdown += `### Core Concepts\n\n`;
    for (const c of studyGuide.keyConcepts) {
      markdown += `#### ${c.concept}\n${c.explanation}\n\n> 💡 **Analogy:** ${c.realWorldAnalogy}\n\n`;
    }
  }

  if (studyGuide.errorCheckOrRefinements && studyGuide.errorCheckOrRefinements.length > 0) {
    markdown += `### Socratic Observations & Checks\n\n`;
    for (const err of studyGuide.errorCheckOrRefinements) {
      markdown += `- 🔍 ${err}\n`;
    }
    markdown += `\n`;
  }

  if (studyGuide.socraticQuestions && studyGuide.socraticQuestions.length > 0) {
    markdown += `### Socratic Discovery Questions\n\n`;
    for (let i = 0; i < studyGuide.socraticQuestions.length; i++) {
      const q = studyGuide.socraticQuestions[i];
      markdown += `**${i + 1}. ${q.question}**\n- *Hint:* ${q.hint}\n- *Deep Dive:* ${q.deeperThinking}\n\n`;
    }
  }

  const imagesArray = thumbnailUrl ? [thumbnailUrl] : [];

  // Check if we can update an existing note
  if (existingNoteId) {
    const { data: updatedNote, error: updateErr } = await supabase
      .from("notes")
      .update({
        title: studyGuide.title || "Handwritten Study Guide",
        subject: resolvedSubject,
        content: markdown,
        images: imagesArray,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingNoteId)
      .eq("student_id", userId)
      .select("id")
      .maybeSingle();

    if (!updateErr && updatedNote) {
      try {
        const { notifyNotesUpdated } = await import("@/lib/notes");
        notifyNotesUpdated();
      } catch (e) {
        // ignore
      }
      toast.success("Existing digital note successfully updated with fresh AI synthesis!");
      return { noteId: updatedNote.id };
    }
  }

  // Otherwise create a new note
  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      student_id: userId,
      title: studyGuide.title || "Handwritten Study Guide",
      subject: resolvedSubject,
      content: markdown,
      is_ai_generated: true,
      images: imagesArray,
    })
    .select("id")
    .single();

  if (error || !note) {
    throw new Error(error?.message || "Failed to create note in database.");
  }

  // Link note to scratchpad
  if (scratchpadId) {
    await supabase
      .from("scratchpads")
      .update({
        linked_note_id: note.id,
        subject: resolvedSubject,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scratchpadId);
  }

  try {
    const { notifyNotesUpdated } = await import("@/lib/notes");
    notifyNotesUpdated();
  } catch (e) {
    // ignore
  }
  toast.success("Study guide saved to your PureLearn Notes!");

  return { noteId: note.id };
}
