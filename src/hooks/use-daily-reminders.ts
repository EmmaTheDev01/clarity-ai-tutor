import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface DailyReminderConfig {
  enabled: boolean;
  time: string; // "HH:MM" e.g. "09:00"
  durationMinutes: number; // e.g. 5, 10, 15
  sound: boolean;
}

const STORAGE_KEY = "purelearn_daily_reminder_config";
const LAST_FIRED_KEY = "purelearn_daily_reminder_last_fired";

const DEFAULT_CONFIG: DailyReminderConfig = {
  enabled: true,
  time: "09:00",
  durationMinutes: 5,
  sound: true,
};

export function useDailyReminders() {
  const [config, setConfig] = useState<DailyReminderConfig>(() => {
    if (typeof window === "undefined" || !window.localStorage) return DEFAULT_CONFIG;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });

  // Persist config whenever updated
  const updateConfig = useCallback((updates: Partial<DailyReminderConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  // Request browser notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Web Push Notifications are not supported on this browser.");
      return "denied";
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === "granted") {
        toast.success("Push notifications enabled! You'll receive daily study prompts.");
      } else if (perm === "denied") {
        toast.error("Notification permission was denied in browser settings.");
      }
      return perm;
    } catch (err) {
      console.warn("Notification request error:", err);
      return "denied";
    }
  }, []);

  // Trigger test notification
  const triggerTestNotification = useCallback(async () => {
    if (typeof window === "undefined") return;

    if (!("Notification" in window)) {
      toast.info("Study Reminder Trigger: Ready for your 5-minute micro-learning session!");
      return;
    }

    if (Notification.permission !== "granted") {
      const perm = await requestPermission();
      if (perm !== "granted") {
        toast.info("In-App Reminder: Time for your daily micro-learning sprint! 🚀");
        return;
      }
    }

    try {
      const notif = new Notification("PureLearn Micro-Learning Time! 🎯", {
        body: `Your daily ${config.durationMinutes}-minute study sprint is ready. Review flashcards or ask your AI tutor to keep your streak alive!`,
        icon: "/favicon.ico",
        tag: "purelearn-daily-study",
      });

      notif.onclick = () => {
        window.focus();
        window.location.href = "/app";
      };

      toast.success("Test notification delivered!");
    } catch (err) {
      toast.info("Time for your daily micro-learning sprint! 🚀");
    }
  }, [config.durationMinutes, requestPermission]);

  // Background check timer for scheduled daily reminder
  useEffect(() => {
    if (typeof window === "undefined" || !config.enabled) return;

    const checkReminder = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMinutes = String(now.getMinutes()).padStart(2, "0");
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayDateStr = now.toISOString().split("T")[0];

      const lastFired = localStorage.getItem(LAST_FIRED_KEY);

      if (currentTimeStr === config.time && lastFired !== todayDateStr) {
        localStorage.setItem(LAST_FIRED_KEY, todayDateStr);

        // Deliver notification
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            const notif = new Notification("Time for Micro-Learning! 🧠", {
              body: `Ready for your ${config.durationMinutes}-minute focus session? Keep your streak burning!`,
              icon: "/favicon.ico",
              tag: "purelearn-daily-scheduled",
            });
            notif.onclick = () => {
              window.focus();
              window.location.href = "/app";
            };
          } catch (e) {}
        }

        toast("Daily Micro-Learning Reminder ⏰", {
          description: `It's ${config.time}! Take a quick ${config.durationMinutes}-minute study break to keep your streak alive.`,
          action: {
            label: "Start Now",
            onClick: () => {
              window.location.href = "/app";
            },
          },
        });
      }
    };

    // Run check every 25 seconds
    const interval = setInterval(checkReminder, 25000);
    return () => clearInterval(interval);
  }, [config.enabled, config.time, config.durationMinutes]);

  return {
    config,
    updateConfig,
    permission,
    requestPermission,
    triggerTestNotification,
  };
}
