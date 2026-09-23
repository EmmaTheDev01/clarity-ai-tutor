import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Headphones,
  Volume2,
  VolumeX,
  Loader2,
  User,
  GraduationCap,
  SlidersHorizontal,
  Check,
  Maximize2,
} from "lucide-react";
import { generateGeminiStructured } from "@/lib/gemini";
import { toast } from "sonner";

export interface SocraticTurn {
  speaker: "mentor" | "student";
  roleName: string;
  text: string;
}

// Known legacy/novelty robotic synthesizers to filter out completely
const ROBOTIC_VOICE_NAMES = new Set([
  "albert",
  "bad news",
  "bahh",
  "bells",
  "boing",
  "bubbles",
  "cellos",
  "deranged",
  "good news",
  "hysterical",
  "junior",
  "kathy",
  "pipe organ",
  "princess",
  "ralph",
  "trinoids",
  "vicki",
  "whisper",
  "zarvox",
  "fred",
  "bruce",
  "agnes",
  "victoria",
  "organ",
  "superstar",
  "wobble",
  "jester",
  "eddy",
  "flo",
  "grandma",
  "grandpa",
  "reed",
  "rocko",
  "sandy",
  "shelley",
]);

function isNaturalVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  for (const robotic of ROBOTIC_VOICE_NAMES) {
    if (name.includes(robotic)) return false;
  }
  // Standard non-enhanced Alex is an older 2007 robotic synth on Mac
  if (name === "alex" || (name.includes("alex") && !name.includes("enhanced") && !name.includes("premium"))) {
    return false;
  }
  return true;
}

// Score voice specifically for the Inquirer (student) to maximize natural, inquisitive human tone
function scoreInquirerVoice(voice: SpeechSynthesisVoice, excludeVoiceURI?: string): number {
  if (excludeVoiceURI && voice.voiceURI === excludeVoiceURI) return -500;
  if (!voice.lang.startsWith("en")) return -500;
  if (!isNaturalVoice(voice)) return -500;

  const n = voice.name.toLowerCase();
  let score = 100;

  // Remote neural voices (e.g. Google US English, Microsoft Online Natural) sound indistinguishable from human speech
  if (!voice.localService) score += 60;
  if (n.includes("google us english") || n.includes("google uk english female") || n.includes("google uk english male")) {
    score += 150;
  }
  if (n.includes("natural")) score += 140;
  if (n.includes("premium")) score += 130;
  if (n.includes("enhanced")) score += 120;
  if (n.includes("neural")) score += 120;
  if (n.includes("siri")) score += 90;

  // Best expressive natural voices for an inquisitive student
  if (n.includes("ava") || n.includes("serena") || n.includes("zoe") || n.includes("jenny") || n.includes("aria") || n.includes("evan") || n.includes("nathan")) {
    score += 80;
  }
  if (n.includes("oliver") || n.includes("jamie") || n.includes("daniel") || n.includes("karen") || n.includes("moira")) {
    score += 60;
  }

  return score;
}

// Score voice for the Mentor (guide / professor)
function scoreMentorVoice(voice: SpeechSynthesisVoice, excludeVoiceURI?: string): number {
  if (excludeVoiceURI && voice.voiceURI === excludeVoiceURI) return -500;
  if (!voice.lang.startsWith("en")) return -500;
  if (!isNaturalVoice(voice)) return -500;

  const n = voice.name.toLowerCase();
  let score = 100;

  if (n.includes("natural")) score += 140;
  if (n.includes("premium")) score += 130;
  if (n.includes("enhanced")) score += 120;
  if (n.includes("neural")) score += 120;
  if (n.includes("siri")) score += 90;

  if (n.includes("daniel") || n.includes("oliver") || n.includes("jamie") || n.includes("samantha") || n.includes("serena")) {
    score += 80;
  }
  if (n.includes("google uk english male") || n.includes("google us english")) {
    score += 100;
  }

  return score;
}

// Preprocess text to ensure clean, conversational pronunciation without TTS artifacts
function cleanSpokenText(text: string): string {
  return text
    // Remove markdown bold / italics
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    // Remove backtick code
    .replace(/`([^`]+)`/g, "$1")
    // Remove markdown links [label](url) -> label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove stage directions in parentheses like (curiously), (pauses)
    .replace(/\([a-zA-Z\s]{2,30}\)/g, "")
    .replace(/\[[a-zA-Z\s]{2,30}\]/g, "")
    // Turn em-dashes into natural breathing pauses
    .replace(/[—–]/g, ", ")
    // Natural expansions
    .replace(/\be\.g\.\b/gi, "for example")
    .replace(/\bi\.e\.\b/gi, "that is")
    .replace(/\betc\.\b/gi, "etcetera")
    // Replace multiple periods with a clean pause
    .replace(/\.{2,}/g, "... ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Custom Hook that manages an active Socratic Audio session across both
 * the full-screen modal and the persistent mini popup docked on top of text input.
 */
export function useSocraticAudio() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const [materialTitle, setMaterialTitle] = useState("");
  const [materialContent, setMaterialContent] = useState("");
  const [materialId, setMaterialId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [turns, setTurns] = useState<SocraticTurn[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.96);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // Selected custom voices for Mentor & Student
  const [mentorVoiceURI, setMentorVoiceURI] = useState<string>("");
  const [studentVoiceURI, setStudentVoiceURI] = useState<string>("");

  const isPlayingRef = useRef(false);
  const currentTurnRef = useRef(0);
  const turnsRef = useRef<SocraticTurn[]>([]);
  const speedRef = useRef(0.96);
  const mutedRef = useRef(false);

  isPlayingRef.current = isPlaying;
  currentTurnRef.current = currentTurnIndex;
  turnsRef.current = turns;
  speedRef.current = playbackSpeed;
  mutedRef.current = isMuted;

  // Filter & rank available voices
  const filteredVoices = useMemo(() => {
    return availableVoices
      .filter((v) => v.lang.startsWith("en") && isNaturalVoice(v))
      .sort((a, b) => scoreInquirerVoice(b) - scoreInquirerVoice(a));
  }, [availableVoices]);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const updateVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setAvailableVoices(v);

        const validVoices = v.filter((item) => item.lang.startsWith("en") && isNaturalVoice(item));
        if (validVoices.length > 0) {
          const savedMentor = localStorage.getItem("socratic_mentor_voice");
          const savedStudent = localStorage.getItem("socratic_student_voice");

          // Pick best natural Mentor voice
          const bestMentor = validVoices.find((item) => item.voiceURI === savedMentor) ||
            validVoices.slice().sort((a, b) => scoreMentorVoice(b) - scoreMentorVoice(a))[0] ||
            validVoices[0];

          // Pick best natural Inquirer voice (distinct from mentor)
          const bestStudent = validVoices.find((item) => item.voiceURI === savedStudent) ||
            validVoices.slice().sort((a, b) => scoreInquirerVoice(b, bestMentor?.voiceURI) - scoreInquirerVoice(a, bestMentor?.voiceURI))[0] ||
            validVoices.find((item) => item.voiceURI !== bestMentor?.voiceURI) ||
            validVoices[0];

          if (bestMentor) setMentorVoiceURI(bestMentor.voiceURI);
          if (bestStudent) setStudentVoiceURI(bestStudent.voiceURI);
        }
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakTurn = useCallback((index: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }

    const currentTurns = turnsRef.current;
    if (index >= currentTurns.length) {
      setIsPlaying(false);
      setCurrentTurnIndex(0);
      return;
    }

    window.speechSynthesis.cancel();

    if (mutedRef.current) return;

    const turn = currentTurns[index];
    const cleanedText = cleanSpokenText(turn.text);
    const utterance = new SpeechSynthesisUtterance(cleanedText);

    // Natural human speaking rate (0.95-1.0 is standard human cadence)
    utterance.rate = Math.min(1.15, Math.max(0.85, speedRef.current));

    // CRITICAL: NEVER modify pitch away from 1.0 to eliminate robotic metallic DSP distortion!
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

    if (turn.speaker === "mentor") {
      const selected = voices.find((v) => v.voiceURI === mentorVoiceURI);
      if (selected) {
        utterance.voice = selected;
      } else {
        const fallbackMentor = voices
          .filter((v) => isNaturalVoice(v))
          .sort((a, b) => scoreMentorVoice(b, studentVoiceURI) - scoreMentorVoice(a, studentVoiceURI))[0];
        if (fallbackMentor) utterance.voice = fallbackMentor;
      }
    } else {
      // Inquirer (student): prioritize highest-scoring natural neural voice
      const selected = voices.find((v) => v.voiceURI === studentVoiceURI);
      if (selected) {
        utterance.voice = selected;
      } else {
        const fallbackInquirer = voices
          .filter((v) => isNaturalVoice(v))
          .sort((a, b) => scoreInquirerVoice(b, mentorVoiceURI) - scoreInquirerVoice(a, mentorVoiceURI))[0];
        if (fallbackInquirer) utterance.voice = fallbackInquirer;
      }
    }

    utterance.onend = () => {
      if (isPlayingRef.current) {
        const nextIdx = index + 1;
        if (nextIdx < currentTurns.length) {
          setCurrentTurnIndex(nextIdx);
          // Natural conversational pause (400ms) between speakers
          setTimeout(() => {
            if (isPlayingRef.current) {
              speakTurn(nextIdx);
            }
          }, 400);
        } else {
          setIsPlaying(false);
          setCurrentTurnIndex(0);
          toast.success("Socratic audio session completed!");
        }
      }
    };

    utterance.onerror = (e) => {
      if (e.error === "canceled" || e.error === "interrupted") return;
      console.warn("SpeechSynthesis error:", e);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);

    // Auto-scroll transcript if element exists
    setTimeout(() => {
      const activeEl = document.getElementById(`audio-turn-${index}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 50);
  }, [availableVoices, mentorVoiceURI, studentVoiceURI]);

  // Generate or load dialogue from cache
  const generateDialogue = useCallback(async (title: string, content: string, id?: string | null) => {
    setIsLoading(true);
    setTurns([]);
    setCurrentTurnIndex(0);
    setIsPlaying(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const resolvedTitle = title || "Active Study Material";
    // Versioned cache key tied to title and content signature so fresh explanatory audio is generated
    const contentSig = (content || "").slice(0, 60).replace(/[^a-zA-Z0-9]/g, "");
    const cacheKey = `notes_audio_v4_${id || encodeURIComponent(resolvedTitle.slice(0, 30))}_${contentSig}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTurns(parsed);
          setCurrentTurnIndex(0);
          setIsLoading(false);
          setIsPlaying(true);
          setTimeout(() => speakTurn(0), 100);
          return;
        }
      } catch {
        // regenerate
      }
    }

    try {
      const schema = {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          turns: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                speaker: { type: "STRING", enum: ["mentor", "student"] },
                roleName: { type: "STRING" },
                text: { type: "STRING" },
              },
              required: ["speaker", "roleName", "text"],
            },
          },
        },
        required: ["title", "turns"],
      };

      const cleanContent = (content || "").slice(0, 4000);
      const prompt = `You are a world-class educational master and concept breakdown expert. Transform the following study notes / chat response into a crystal-clear, comprehensive spoken audio explanation.

CRITICAL RULES:
1. EXPLANATION ONLY — ABSOLUTELY NO QUESTIONS & ANSWERS:
   - Do NOT format this as questions and answers, a quiz, or an interrogation.
   - Neither speaker should ask questions like "What is...?", "Can you explain...?", or "Have you wondered...?".
   - Both speakers are knowledgeable educators explaining the concepts directly and collaboratively to the student listening.

2. EXPLAIN ALL CONCEPTS AND EVERYTHING IN THE CONTENT:
   - Thoroughly explain ALL key concepts, definitions, underlying mechanisms, formulas/steps, nuances, and practical takeaways present in the notes or chat response.
   - Do NOT gloss over or skip core technical points or definitions.
   - Break down complex terms into intuitive, crystal-clear language with real-world analogies.

3. COLLABORATIVE EXPLANATORY ROLES:
   - Guide (speaker: "mentor", roleName: "Guide"): Introduces the core concepts, provides foundational definitions, big-picture intuition, and relatable real-world analogies.
   - Analyst (speaker: "student", roleName: "Analyst"): Unpacks the inner mechanics, step-by-step logic, technical details, nuances, and concrete applications.
   - Both build on each other's points seamlessly: "Notice how this mechanism works...", "Building on that principle, here is the exact step...", "In practical applications, this means...".

4. NATURAL SPOKEN AUDIO:
   - Write for the ear: smooth, natural conversational cadence and transitions.
   - Keep each turn to 2 to 3 engaging, well-crafted spoken sentences.
   - ABSOLUTELY NO MARKDOWN formatting, bullet points, asterisks, or hashes in the text field.
   - Generate between 6 and 12 collaborative explanatory turns covering the entire material thoroughly.

Material Title: "${resolvedTitle}"
Notes / Chat Response Content:
${cleanContent || "Foundational academic overview of " + resolvedTitle}`;

      const res = await generateGeminiStructured<{
        title: string;
        turns: SocraticTurn[];
      }>({
        systemInstruction: "You produce comprehensive, spoken concept audio explanations in valid JSON schema without questions.",
        prompt,
        responseSchema: schema,
      });

      if (res.data.turns && res.data.turns.length > 0) {
        setTurns(res.data.turns);
        localStorage.setItem(cacheKey, JSON.stringify(res.data.turns));
        setIsPlaying(true);
        setTimeout(() => speakTurn(0), 100);
      } else {
        throw new Error("No dialogue turns returned");
      }
    } catch (err) {
      console.warn("Concept audio generation fallback:", err);
      const fallbackTurns: SocraticTurn[] = [
        {
          speaker: "mentor",
          roleName: "Guide",
          text: `Welcome to our audio concept breakdown on ${resolvedTitle}. Today, we're walking through all the key ideas, mechanisms, and takeaways from your notes so you have a complete, intuitive understanding.`,
        },
        {
          speaker: "student",
          roleName: "Analyst",
          text: `Let's begin with the foundational principle. At its core, this topic establishes how fundamental components operate under clear rules to solve complex challenges efficiently.`,
        },
        {
          speaker: "mentor",
          roleName: "Guide",
          text: `To picture this intuitively, think of the primary components working together like an interconnected system. When one element changes, the rest adapt according to these exact principles.`,
        },
        {
          speaker: "student",
          roleName: "Analyst",
          text: `Breaking down the mechanics step by step, notice how each operation directly connects to the previous state, ensuring stability, precision, and reliability throughout.`,
        },
        {
          speaker: "mentor",
          roleName: "Guide",
          text: `A critical detail highlighted in the notes is avoiding common misconceptions by keeping the fundamental definitions in mind whenever analyzing edge cases.`,
        },
        {
          speaker: "student",
          roleName: "Analyst",
          text: `In summary, mastering both the underlying mechanism and its practical application gives you full clarity on everything covered in this topic.`,
        },
      ];
      setTurns(fallbackTurns);
      setIsPlaying(true);
      setTimeout(() => speakTurn(0), 100);
    } finally {
      setIsLoading(false);
    }
  }, [speakTurn]);

  // Open modal and start audio session
  const openModal = useCallback((material: { title: string; content: string; id?: string }) => {
    setMaterialTitle(material.title || "Active Study Material");
    setMaterialContent(material.content || "");
    setMaterialId(material.id || null);
    setIsModalOpen(true);
    setIsPopupVisible(true);
    generateDialogue(material.title, material.content, material.id);
  }, [generateDialogue]);

  // Close modal but KEEP the audio popup on top of text input and KEEP audio playing!
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    // Note: Do NOT stop speech synthesis, do NOT hide popup.
    setIsPopupVisible(true);
  }, []);

  // Completely close and dismiss the audio popup (stops audio)
  const closePopup = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPopupVisible(false);
    setIsModalOpen(false);
  }, []);

  // Re-open full modal from popup
  const reopenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakTurn(currentTurnIndex);
    }
  }, [isPlaying, currentTurnIndex, speakTurn]);

  const nextTurn = useCallback(() => {
    if (currentTurnIndex < turns.length - 1) {
      const nextIdx = currentTurnIndex + 1;
      setCurrentTurnIndex(nextIdx);
      if (isPlaying) {
        speakTurn(nextIdx);
      }
    }
  }, [currentTurnIndex, turns.length, isPlaying, speakTurn]);

  const prevTurn = useCallback(() => {
    if (currentTurnIndex > 0) {
      const prevIdx = currentTurnIndex - 1;
      setCurrentTurnIndex(prevIdx);
      if (isPlaying) {
        speakTurn(prevIdx);
      }
    }
  }, [currentTurnIndex, isPlaying, speakTurn]);

  const restart = useCallback(() => {
    setCurrentTurnIndex(0);
    if (isPlaying) {
      speakTurn(0);
    }
  }, [isPlaying, speakTurn]);

  const jumpToTurn = useCallback((idx: number) => {
    setCurrentTurnIndex(idx);
    setIsPlaying(true);
    speakTurn(idx);
  }, [speakTurn]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      mutedRef.current = false;
      if (isPlaying) speakTurn(currentTurnIndex);
    } else {
      setIsMuted(true);
      mutedRef.current = true;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isMuted, isPlaying, currentTurnIndex, speakTurn]);

  const testVoice = useCallback((voiceURI: string, isStudent: boolean = false) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const voice = availableVoices.find((v) => v.voiceURI === voiceURI);
    const testPhrase = isStudent
      ? "Breaking down the mechanics step by step, notice how each component operates according to these principles."
      : "Welcome to our concept breakdown. Let's walk through all the core principles from your notes together.";
    const utterance = new SpeechSynthesisUtterance(testPhrase);
    utterance.rate = isStudent ? 0.98 : speedRef.current;
    utterance.pitch = 1.0;
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, [availableVoices]);

  return {
    isModalOpen,
    isPopupVisible,
    materialTitle,
    materialContent,
    materialId,
    isLoading,
    turns,
    currentTurnIndex,
    isPlaying,
    playbackSpeed,
    isMuted,
    availableVoices,
    filteredVoices,
    mentorVoiceURI,
    studentVoiceURI,
    showVoiceSettings,
    setShowVoiceSettings,
    setPlaybackSpeed,
    setMentorVoiceURI,
    setStudentVoiceURI,
    openModal,
    closeModal,
    closePopup,
    reopenModal,
    togglePlay,
    nextTurn,
    prevTurn,
    restart,
    jumpToTurn,
    toggleMute,
    testVoice,
    regenerateDialogue: () => generateDialogue(materialTitle, materialContent, materialId),
  };
}

export type SocraticAudioSession = ReturnType<typeof useSocraticAudio>;

/**
 * Docked Mini Audio Popup that stays right on top of the text input
 * when the audio modal is closed, featuring a button on the top right to close it.
 */
export function SocraticAudioMiniPopup({
  session,
  onExpand,
  onClose,
}: {
  session: SocraticAudioSession;
  onExpand: () => void;
  onClose: () => void;
}) {
  const currentTurn = session.turns[session.currentTurnIndex];
  if (!currentTurn) return null;

  return (
    <div
      className="mb-2 rounded-xl border border-border bg-card shadow-md px-3 py-1.5 transition-all animate-in fade-in slide-in-from-bottom-1 text-foreground"
      role="region"
      aria-label="Audio Notes Player"
    >
      {/* Compact Main Controls & Status Row */}
      <div className="flex items-center justify-between gap-2.5">
        {/* Playback Navigation Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={session.prevTurn}
            disabled={session.currentTurnIndex === 0}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-25 transition cursor-pointer"
            title="Previous section"
            aria-label="Previous section"
          >
            <SkipBack className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={session.togglePlay}
            className="h-7 w-7 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition flex items-center justify-center cursor-pointer shadow-xs shrink-0"
            title={session.isPlaying ? "Pause" : "Play"}
            aria-label={session.isPlaying ? "Pause" : "Play"}
          >
            {session.isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={session.nextTurn}
            disabled={session.currentTurnIndex >= session.turns.length - 1}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-25 transition cursor-pointer"
            title="Next section"
            aria-label="Next section"
          >
            <SkipForward className="h-3 w-3" />
          </button>
        </div>

        {/* Center: Active Speaker Badge & Truncated Note Snippet (Clickable to Expand) */}
        <div
          className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer group"
          onClick={onExpand}
          title="Click to expand audio notes breakdown"
        >
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
              currentTurn.speaker === "student"
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-muted text-foreground border-border"
            }`}
          >
            {currentTurn.speaker === "student" ? (
              <User className="h-2.5 w-2.5" />
            ) : (
              <GraduationCap className="h-2.5 w-2.5 text-primary" />
            )}
            {currentTurn.roleName || (currentTurn.speaker === "student" ? "Analyst" : "Guide")}
          </span>

          <p className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors flex-1">
            &ldquo;{currentTurn.text}&rdquo;
          </p>
        </div>

        {/* Right Action Items: Counter, Expand, Close */}
        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline px-1">
            {session.currentTurnIndex + 1}/{session.turns.length}
          </span>
          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-muted text-muted-foreground border border-border hidden md:inline">
            {session.playbackSpeed}x
          </span>
          <button
            type="button"
            onClick={onExpand}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            title="Expand to full explanation"
            aria-label="Expand audio"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            title="Close audio player"
            aria-label="Close audio popup"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Slim Interactive Timeline Scrubber */}
      <div className="relative mt-1 group">
        <div className="w-full bg-muted rounded-full h-1 overflow-hidden border border-border/40">
          <div
            className="bg-primary h-full transition-all duration-150 rounded-full"
            style={{
              width: `${session.turns.length > 1 ? (session.currentTurnIndex / (session.turns.length - 1)) * 100 : 100}%`,
            }}
          />
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(0, session.turns.length - 1)}
          step={1}
          value={session.currentTurnIndex}
          onChange={(e) => session.jumpToTurn(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          title="Drag or click to seek timeline"
          aria-label="Seek timeline"
        />

        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background shadow-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            left: `${session.turns.length > 1 ? (session.currentTurnIndex / (session.turns.length - 1)) * 100 : 100}%`,
          }}
        />
      </div>
    </div>
  );
}

export interface SocraticAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialTitle?: string | null;
  materialContent?: string | null;
  materialId?: string | null;
  session?: SocraticAudioSession;
}

/**
 * Full Socratic Audio Modal Dialog with full dialogue transcript and voice customization.
 */
export function SocraticAudioModal({
  isOpen,
  onClose,
  session: propSession,
}: SocraticAudioModalProps) {
  // If no external session is provided, instantiate local fallback session
  const fallbackSession = useSocraticAudio();
  const session = propSession || fallbackSession;

  if (!isOpen) return null;

  const currentTurn = session.turns[session.currentTurnIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl flex flex-col max-h-[92vh] overflow-hidden text-card-foreground"
        role="dialog"
        aria-modal="true"
      >
        {/* Header - Styled with App Colors */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground leading-tight">
                  Audio Notes Overview
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground border border-border">
                  Concept Breakdown
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-sm sm:max-w-md mt-0.5 font-medium">
                {session.materialTitle || "Active Study Material"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => session.setShowVoiceSettings(!session.showVoiceSettings)}
              className={`p-2 rounded-lg border transition cursor-pointer ${
                session.showVoiceSettings
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title="Voice Settings"
              aria-label="Voice Settings"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              aria-label="Close"
              title="Close modal (minimizes to chat bar)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Voice Selection Drawer */}
        {session.showVoiceSettings && (
          <div className="border-b border-border bg-muted/40 p-4 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Natural Voice Customization
              </span>
              <span className="text-[10px] text-muted-foreground">
                Natural neural voices prioritized
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mentor Voice */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" /> Lead Explainer Voice (Guide)
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={session.mentorVoiceURI}
                    onChange={(e) => {
                      session.setMentorVoiceURI(e.target.value);
                      localStorage.setItem("socratic_mentor_voice", e.target.value);
                      session.testVoice(e.target.value, false);
                    }}
                    className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    {session.filteredVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => session.testVoice(session.mentorVoiceURI, false)}
                    className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs shrink-0 cursor-pointer"
                    title="Test Guide Voice"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Inquirer (Student) Voice */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" /> Deep Dive Voice (Analyst)
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={session.studentVoiceURI}
                    onChange={(e) => {
                      session.setStudentVoiceURI(e.target.value);
                      localStorage.setItem("socratic_student_voice", e.target.value);
                      session.testVoice(e.target.value, true);
                    }}
                    className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    {session.filteredVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => session.testVoice(session.studentVoiceURI, true)}
                    className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs shrink-0 cursor-pointer"
                    title="Test Analyst Voice"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {session.isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="p-3 rounded-full bg-primary/10 text-primary animate-spin">
                <Loader2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">Composing Concept Explanation...</h4>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Transforming study notes and chat responses into an insightful spoken breakdown of all key concepts.
                </p>
              </div>
            </div>
          ) : session.turns.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-xs text-muted-foreground">No explanation generated yet.</p>
              <button
                onClick={session.regenerateDialogue}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
              >
                Generate Audio Notes
              </button>
            </div>
          ) : (
            <>
              {/* Active Speaker Banner with Animated Wave */}
              {currentTurn && (
                <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        currentTurn.speaker === "mentor"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted text-foreground border border-border"
                      }`}
                    >
                      {currentTurn.speaker === "mentor" ? (
                        <GraduationCap className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground">
                          {currentTurn.roleName}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                          ({currentTurn.speaker === "mentor" ? "Lead Explainer" : "Concept Analyst"})
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        Section {session.currentTurnIndex + 1} of {session.turns.length}
                      </p>
                    </div>
                  </div>

                  {/* Animated Wave Indicator */}
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-background border border-border">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <span
                        key={bar}
                        className={`w-1 rounded-full bg-primary transition-all duration-300 ${
                          session.isPlaying
                            ? bar % 2 === 0
                              ? "h-4 animate-pulse"
                              : "h-2.5 animate-bounce"
                            : "h-1.5 opacity-30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Spoken Explanation Transcript */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                  <span>Audio Explanation Transcript</span>
                  <span>Click any line to play</span>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {session.turns.map((t, idx) => {
                    const isActive = idx === session.currentTurnIndex;
                    const isMentor = t.speaker === "mentor";
                    return (
                      <div
                        id={`audio-turn-${idx}`}
                        key={idx}
                        onClick={() => session.jumpToTurn(idx)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all duration-200 flex gap-3 ${
                          isActive
                            ? "bg-primary/5 border-primary/50 shadow-xs ring-1 ring-primary/20 scale-[1.005]"
                            : "bg-background border-border/70 hover:border-border hover:bg-muted/30"
                        }`}
                      >
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                            isMentor
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          {isMentor ? "M" : "S"}
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px] text-foreground">
                              {t.roleName}
                            </span>
                            {isActive && session.isPlaying && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-primary">
                                <Volume2 className="h-3 w-3 animate-pulse" /> Speaking
                              </span>
                            )}
                          </div>
                          <p
                            className={`leading-relaxed ${
                              isActive ? "text-foreground font-medium" : "text-muted-foreground"
                            }`}
                          >
                            {t.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Playback Controls */}
        <div className="border-t border-border p-4 bg-muted/20 space-y-3">
          {/* Interactive Seekable Timeline Scrubber */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground">Section {session.currentTurnIndex + 1}</span>
                <span className="text-[10px] text-muted-foreground">of {session.turns.length}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                <span>Click or drag to seek</span>
              </div>
            </div>

            <div className="relative flex items-center group py-1.5">
              {/* Background Visual Track */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/60 relative">
                <div
                  className="h-full bg-primary transition-all duration-150 rounded-full"
                  style={{
                    width: `${session.turns.length > 1 ? (session.currentTurnIndex / (session.turns.length - 1)) * 100 : 100}%`,
                  }}
                />
              </div>

              {/* Accessible Range Input layered directly on top for smooth scrubbing & seeking */}
              <input
                type="range"
                min={0}
                max={Math.max(0, session.turns.length - 1)}
                step={1}
                value={session.currentTurnIndex}
                onChange={(e) => session.jumpToTurn(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title="Drag or click anywhere to seek timeline"
                aria-label="Seek Audio Notes timeline"
              />

              {/* Scrubber Thumb Indicator that expands on hover */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-background border-2 border-primary shadow-md pointer-events-none transition-transform group-hover:scale-125"
                style={{
                  left: `${session.turns.length > 1 ? (session.currentTurnIndex / (session.turns.length - 1)) * 100 : 100}%`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* Speed selection */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1 hidden sm:inline">
                Speed:
              </span>
              {[0.8, 0.96, 1.1, 1.25].map((spd) => (
                <button
                  key={spd}
                  onClick={() => session.setPlaybackSpeed(spd)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                    session.playbackSpeed === spd
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {spd === 0.96 ? "1.0x" : `${spd}x`}
                </button>
              ))}
            </div>

            {/* Main playback buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={session.prevTurn}
                disabled={session.currentTurnIndex === 0 || session.turns.length === 0}
                className="p-2 rounded-full border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition text-foreground cursor-pointer"
                title="Previous Section"
              >
                <SkipBack className="h-4 w-4" />
              </button>

              <button
                onClick={session.togglePlay}
                disabled={session.turns.length === 0 || session.isLoading}
                className="h-11 w-11 rounded-full bg-primary text-primary-foreground hover:opacity-90 shadow-md flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title={session.isPlaying ? "Pause" : "Play"}
              >
                {session.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </button>

              <button
                onClick={session.nextTurn}
                disabled={session.currentTurnIndex >= session.turns.length - 1 || session.turns.length === 0}
                className="p-2 rounded-full border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition text-foreground cursor-pointer"
                title="Next Section"
              >
                <SkipForward className="h-4 w-4" />
              </button>

              <button
                onClick={session.restart}
                disabled={session.turns.length === 0}
                className="p-2 rounded-full border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition text-muted-foreground hover:text-foreground ml-1 cursor-pointer"
                title="Restart Audio"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {/* Mute and Re-generate */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={session.toggleMute}
                className="p-2 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                title={session.isMuted ? "Unmute" : "Mute"}
              >
                {session.isMuted ? <VolumeX className="h-4 w-4 text-destructive" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button
                onClick={session.regenerateDialogue}
                disabled={session.isLoading}
                className="p-2 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition disabled:opacity-40 cursor-pointer"
                title="Regenerate Audio Explanation"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
