import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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

