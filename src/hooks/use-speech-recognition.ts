import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface UseSpeechRecognitionOptions {
  onTranscriptChange?: (text: string) => void;
  onComplete?: (text: string) => void;
  silenceTimeoutMs?: number;
  lang?: string;
}

export function useSpeechRecognition({
  onTranscriptChange,
  onComplete,
  silenceTimeoutMs = 1400,
  lang,
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedTextRef = useRef<string>("");
  const hasSentRef = useRef<boolean>(false);

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setIsSupported(Boolean(SpeechRecognition));
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const finishAndSend = useCallback(() => {
    clearSilenceTimer();
    if (hasSentRef.current) return;
    const textToSend = accumulatedTextRef.current.trim();
    if (textToSend.length > 0) {
      hasSentRef.current = true;
      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } catch (err) {
        // Ignore stop error if already stopped
      }
      setIsListening(false);
      onComplete?.(textToSend);
    } else {
      setIsListening(false);
    }
  }, [clearSilenceTimer, onComplete]);

  const stopListening = useCallback(
    (cancel: boolean = false) => {
      clearSilenceTimer();
      if (cancel) {
        hasSentRef.current = true; // Mark as handled so it doesn't send onend
      }
      try {
        if (recognitionRef.current) {
          if (cancel) {
            recognitionRef.current.abort();
          } else {
            recognitionRef.current.stop();
          }
        }
      } catch (err) {
        // Ignore abort/stop errors
      }
      setIsListening(false);
      if (!cancel && !hasSentRef.current && accumulatedTextRef.current.trim().length > 0) {
        finishAndSend();
      }
    },
    [clearSilenceTimer, finishAndSend]
  );

  const startListening = useCallback(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    clearSilenceTimer();
    accumulatedTextRef.current = "";
    hasSentRef.current = false;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = lang || (typeof navigator !== "undefined" ? navigator.language : "en-US") || "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let final = "";
        let interim = "";

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + " ";
          } else {
            interim += result[0].transcript;
          }
        }

        const combined = (final + interim).trim();
        if (combined) {
          accumulatedTextRef.current = combined;
          onTranscriptChange?.(combined);

          // User spoke something, reset silence debounce timer
          clearSilenceTimer();
          silenceTimerRef.current = setTimeout(() => {
            // User stopped speaking for silenceTimeoutMs -> consider it as hit send
            finishAndSend();
          }, silenceTimeoutMs);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "no-speech") {
          // Normal if the user opened mic and hasn't said anything yet
          return;
        }
        if (event.error === "not-allowed") {
          toast.error("Microphone permission was denied. Please allow microphone access in your browser.");
        } else if (event.error !== "aborted") {
          toast.error(`Speech recognition: ${event.error}`);
        }
        stopListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
        // If not cancelled and we have words that haven't been sent, send now
        if (!hasSentRef.current && accumulatedTextRef.current.trim().length > 0) {
          finishAndSend();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn("Failed to initialize SpeechRecognition:", err);
      toast.error("Could not start microphone for speech recognition.");
      setIsListening(false);
    }
  }, [clearSilenceTimer, finishAndSend, lang, onTranscriptChange, silenceTimeoutMs, stopListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening(false);
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [clearSilenceTimer]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}

