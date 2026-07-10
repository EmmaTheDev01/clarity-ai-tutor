import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  animation?: "fade-up" | "fade-left" | "fade-right" | "scale-in" | "zoom-out";
  duration?: number;
  delay?: number;
  threshold?: number;
  className?: string;
}

export function ScrollReveal({
  children,
  animation = "fade-up",
  duration = 750,
  delay = 0,
  threshold = 0.1,
  className = "",
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Feature detect native CSS scroll-driven animations
    const supportsSDA =
      typeof CSS !== "undefined" &&
      CSS.supports?.("(animation-timeline: view()) and (animation-range: entry)");

    if (supportsSDA) {
      // Let the CSS engine handle scroll-linked timelines natively
      setIsRevealed(true);
      return;
    }

    // Fallback: IntersectionObserver for browsers without Scroll-Driven Animations support
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const style = {
    "--reveal-duration": `${duration}ms`,
    "--reveal-delay": `${delay}ms`,
  } as React.CSSProperties;

  const animationClass = `reveal-${animation}`;
  const revealedClass = isRevealed ? "reveal-active" : "";

  return (
    <div
      ref={elementRef}
      className={`reveal-wrapper ${animationClass} ${revealedClass} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
