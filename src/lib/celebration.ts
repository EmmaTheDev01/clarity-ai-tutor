// PureLearn Dynamic Celebration & Variable Rewards Engine
// Lightweight, zero-dependency canvas confetti and gamification feedback

export interface BadgeAward {
  id: string;
  title: string;
  description: string;
  badgeType: string;
  xpBonus: number;
}

export const KNOWN_BADGES: BadgeAward[] = [
  {
    id: "5_day_streak",
    title: "5-Day Streak",
    description: "Consistent 5-day daily micro-learning streak! +10 Daily Bonus Tokens",
    badgeType: "5_day_streak",
    xpBonus: 100,
  },
  {
    id: "10_day_streak",
    title: "10-Day Streak",
    description: "Incredible 10-day streak momentum! +25 Daily Bonus Tokens",
    badgeType: "10_day_streak",
    xpBonus: 250,
  },
  {
    id: "20_day_streak",
    title: "20-Day Streak",
    description: "Remarkable 20-day streak dedication! +50 Daily Bonus Tokens",
    badgeType: "20_day_streak",
    xpBonus: 500,
  },
  {
    id: "30_day_streak",
    title: "30-Day Master",
    description: "Phenomenal 30-day continuous study habit! +100 Daily Bonus Tokens",
    badgeType: "30_day_streak",
    xpBonus: 1000,
  },
  {
    id: "quiz_master",
    title: "Concept Master",
    description: "Answered every question with conceptual accuracy on a material quiz!",
    badgeType: "quiz_master",
    xpBonus: 80,
  },
  {
    id: "first_flashcard_mastery",
    title: "Flashcard Ace",
    description: "Completed a full flashcard mastery review session!",
    badgeType: "Flashcard Ace",
    xpBonus: 50,
  },
  {
    id: "streak_keeper",
    title: "Streak Champion",
    description: "Maintained a continuous daily study streak!",
    badgeType: "5_day_streak",
    xpBonus: 75,
  },
  {
    id: "knowledge_investor",
    title: "Knowledge Vault",
    description: "Invested learning by saving key takeaways to study notes!",
    badgeType: "knowledge_investor",
    xpBonus: 40,
  },
  {
    id: "quick_mind",
    title: "Quick Learner",
    description: "Completed a 1-tap micro-learning sprint!",
    badgeType: "quick_mind",
    xpBonus: 35,
  },
];

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  decay: number;
}

const CONFETTI_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f43f5e", // Rose
];

/**
 * Triggers a celebratory confetti burst on the active screen.
 * Automatically cleans up the canvas after animation concludes.
 */
export function triggerCelebration(options?: {
  particleCount?: number;
  durationMs?: number;
  playChime?: boolean;
}) {
  if (typeof window === "undefined") return;

  const count = options?.particleCount ?? 85;
  const duration = options?.durationMs ?? 2500;
  const playSound = options?.playChime ?? true;

  if (playSound) {
    playCelebrationChime();
  }

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "99999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const particles: Particle[] = [];
  const startX = w / 2;
  const startY = h * 0.45;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const velocity = 5 + Math.random() * 8;
    particles.push({
      x: startX,
      y: startY,
      size: 5 + Math.random() * 6,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      speedX: Math.cos(angle) * velocity,
      speedY: Math.sin(angle) * velocity - 3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
      decay: 0.008 + Math.random() * 0.012,
    });
  }

  let animationFrameId: number;
  const startTime = performance.now();

  function render(now: number) {
    const elapsed = now - startTime;
    if (elapsed > duration || particles.length === 0) {
      if (canvas.parentNode) {
        document.body.removeChild(canvas);
      }
      return;
    }

    ctx?.clearRect(0, 0, w, h);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.speedY += 0.18; // Gravity
      p.speedX *= 0.98; // Drag
      p.rotation += p.rotationSpeed;
      p.opacity -= p.decay;

      if (p.opacity <= 0 || p.y > h + 50) {
        particles.splice(i, 1);
        continue;
      }

      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rotation);
      ctx!.globalAlpha = Math.max(0, p.opacity);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      ctx!.restore();
    }

    animationFrameId = requestAnimationFrame(render);
  }

  animationFrameId = requestAnimationFrame(render);
}

/**
 * Synthesizes a subtle, pleasant victory chime via Web Audio API
 */
export function playCelebrationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
    });

    setTimeout(() => {
      try {
        ctx.close();
      } catch (e) {}
    }, 1500);
  } catch (err) {
    // Audio contexts may be blocked by browser policy without user gesture; fail silently
  }
}

/**
 * Saves and unlocks a badge if not already unlocked
 */
export function unlockBadge(badgeId: string): BadgeAward | null {
  if (typeof window === "undefined" || !window.localStorage) return null;

  try {
    const raw = localStorage.getItem("purelearn_unlocked_badges");
    const current: string[] = raw ? JSON.parse(raw) : [];

    if (!current.includes(badgeId)) {
      current.push(badgeId);
      localStorage.setItem("purelearn_unlocked_badges", JSON.stringify(current));

      window.dispatchEvent(
        new CustomEvent("purelearn:badge_unlocked", {
          detail: { badgeId },
        })
      );

      return KNOWN_BADGES.find((b) => b.id === badgeId) || null;
    }
  } catch {
    // ignore
  }
  return null;
}
