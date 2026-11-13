// PureLearn AI - Voice Command Recognition & Semantic Mapping
// Supports natural speech commands for hands-free and accessible learning

export interface VoiceCommandMatch {
  type: "audio" | "quiz" | "flashcards" | "all" | "tone" | null;
  toneStyle?: "socratic" | "simplified" | "exam_prep";
  cleanedText: string;
  originalText: string;
  matchedPhrase?: string;
  label: string;
  actionLabel: string;
}

export const VOICE_COMMAND_EXAMPLES = [
  { phrase: "by audio / using just audio / podcast", action: "Launch Socratic Audio Breakdown" },
  { phrase: "make a quiz / by quiz / quiz me", action: "Generate & Launch Adaptive Quiz" },
  { phrase: "make flashcards / by flashcards", action: "Generate High-Yield Flashcard Deck" },
  { phrase: "generate all / complete study pack", action: "Build Quiz + Flashcards + Audio all at once" },
  { phrase: "simplify this / exam prep", action: "Switch AI Tutor Style" },
];

function sanitizeCleaned(text: string): string {
  return text
    .replace(/^[\s,.:;!?\-—_]+|[\s,.:;!?\-—_]+$/g, "")
    .replace(/^(?:on|about|for|regarding|with|in)\s+/i, "")
    .replace(/^[\s,.:;!?\-—_]+|[\s,.:;!?\-—_]+$/g, "")
    .trim();
}

/**
 * Detects whether a spoken phrase or user input matches an actionable voice command.
 */
export function detectVoiceCommand(rawText: string): VoiceCommandMatch {
  const trimmed = rawText.trim();
  const lower = trimmed.toLowerCase();

  // 1. All-in-one / Study pack commands
  const allRegex = /\b(?:generate\s+all|make\s+(?:it\s+)?all|create\s+all|all\s+study\s+pack|complete\s+study\s+(?:pack|bundle)|everything|quiz\s+flashcards\s+and\s+audio)\b/i;
  const allMatch = lower.match(allRegex);
  if (allMatch || /@all\b/i.test(trimmed)) {
    const cleaned = sanitizeCleaned(
      trimmed
        .replace(allRegex, "")
        .replace(/@all\b/gi, "")
    );
    return {
      type: "all",
      cleanedText: cleaned,
      originalText: trimmed,
      matchedPhrase: allMatch ? allMatch[0] : "@all",
      label: "Complete Study Pack",
      actionLabel: "Complete Study Pack",
    };
  }

  // 2. Audio / Podcast commands
  const audioRegex = /\b(?:using\s+(?:just\s+)?audio|by\s+audio|using\s+audio|with\s+audio|in\s+audio|podcast(?:s)?|audio\s+notes?|audio\s+breakdown|listen\s+(?:to\s+this)?|read\s+(?:this\s+)?(?:out\s+loud|aloud)|voice\s+(?:mode|breakdown|notes?))\b/i;
  const audioMatch = lower.match(audioRegex);
  if (audioMatch || /@(audio|listen)\b/i.test(trimmed)) {
    const cleaned = sanitizeCleaned(
      trimmed
        .replace(audioRegex, "")
        .replace(/@(audio|listen)\b/gi, "")
        .replace(/^(?:explain|summarize|teach\s+me|tell\s+me\s+about)\s+/i, "")
    );
    return {
      type: "audio",
      cleanedText: cleaned,
      originalText: trimmed,
      matchedPhrase: audioMatch ? audioMatch[0] : "@audio",
      label: "Audio Breakdown",
      actionLabel: "Audio Breakdown",
    };
  }

  // 3. Quiz commands
  const quizRegex = /\b(?:make\s+(?:a\s+)?quiz(?:z)?|create\s+(?:a\s+)?quiz(?:z)?|generate\s+(?:a\s+)?quiz(?:z)?|by\s+quiz(?:z)?|quiz\s+me|take\s+(?:a\s+)?quiz(?:z)?|practice\s+quiz(?:z)?|test\s+(?:my\s+understanding|me)|give\s+me\s+(?:a\s+)?quiz(?:z)?|start\s+(?:a\s+)?quiz(?:z)?)\b/i;
  const quizMatch = lower.match(quizRegex);
  if (quizMatch || /@quiz\b/i.test(trimmed)) {
    const cleaned = sanitizeCleaned(
      trimmed
        .replace(quizRegex, "")
        .replace(/@quiz\b/gi, "")
    );
    return {
      type: "quiz",
      cleanedText: cleaned,
      originalText: trimmed,
      matchedPhrase: quizMatch ? quizMatch[0] : "@quiz",
      label: "Material Quiz",
      actionLabel: "Material Quiz",
    };
  }

  // 4. Flashcards commands
  const flashcardsRegex = /\b(?:make\s+(?:some\s+)?flashcards?|create\s+(?:some\s+)?flashcards?|generate\s+(?:some\s+)?flashcards?|by\s+flashcards?|study\s+cards?|revision\s+cards?|make\s+cards?)\b/i;
  const flashcardsMatch = lower.match(flashcardsRegex);
  if (flashcardsMatch || /@flashcards\b/i.test(trimmed)) {
    const cleaned = sanitizeCleaned(
      trimmed
        .replace(flashcardsRegex, "")
        .replace(/@flashcards\b/gi, "")
    );
    return {
      type: "flashcards",
      cleanedText: cleaned,
      originalText: trimmed,
      matchedPhrase: flashcardsMatch ? flashcardsMatch[0] : "@flashcards",
      label: "Study Flashcards",
      actionLabel: "Study Flashcards",
    };
  }

  // 5. Tone / Teaching style voice commands
  if (/\b(?:simplify(?:\s+this)?|explain\s+like\s+I'm\s+5|direct\s+simplification)\b/i.test(lower)) {
    const cleaned = sanitizeCleaned(
      trimmed.replace(/\b(?:simplify(?:\s+this)?|explain\s+like\s+I'm\s+5|direct\s+simplification)\b/gi, "")
    );
    return {
      type: "tone",
      toneStyle: "simplified",
      cleanedText: cleaned,
      originalText: trimmed,
      matchedPhrase: "simplify",
      label: "Direct Simplification",
      actionLabel: "Direct Simplification",
    };
  }

  if (/\b(?:exam\s+prep|prepare\s+(?:me\s+)?for\s+(?:my\s+)?exam|exam\s+revision)\b/i.test(lower)) {
    const cleaned = sanitizeCleaned(
      trimmed.replace(/\b(?:exam\s+prep|prepare\s+(?:me\s+)?for\s+(?:my\s+)?exam|exam\s+revision)\b/gi, "")
    );
    return {
      type: "tone",
      toneStyle: "exam_prep",
      cleanedText: cleaned,
      originalText: trimmed,
      matchedPhrase: "exam prep",
      label: "Exam Revision",
      actionLabel: "Exam Revision",
    };
  }

  if (/\b(?:socratic(?:\s+mode)?|socratic\s+inquirer|probe\s+me)\b/i.test(lower)) {
    const cleaned = sanitizeCleaned(
      trimmed.replace(/\b(?:socratic(?:\s+mode)?|socratic\s+inquirer|probe\s+me)\b/gi, "")
    );
    return {
      type: "tone",
      toneStyle: "socratic",
      cleanedText: cleaned,
      originalText: trimmed,
      matchedPhrase: "socratic",
      label: "Socratic Inquirer",
      actionLabel: "Socratic Inquirer",
    };
  }

  return {
    type: null,
    cleanedText: trimmed,
    originalText: trimmed,
    label: "",
    actionLabel: "",
  };
}
