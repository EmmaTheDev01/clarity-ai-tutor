import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  animation?:
    | "fade-up"
    | "fade-down"
    | "fade-left"
    | "fade-right"
    | "scale-in"
    | "zoom-out"
    | "crazy-reveal"
    | "flip-up";
  duration?: number;
  delay?: number;
  threshold?: number;
  className?: string;
  once?: boolean;
}

export function ScrollReveal({
  children,
  animation = "fade-up",
  duration = 750,
  delay = 0,
  threshold = 0.15,
  className = "",
  once = true,
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // IntersectionObserver configured with rootMargin so animations trigger
    // noticeably as the element enters the active viewing area
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          if (once) {
            observer.unobserve(el);
          }
        } else if (!once) {
          setIsRevealed(false);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -60px 0px",
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

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
