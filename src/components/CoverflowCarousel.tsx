import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

export interface CoverflowItem {
  id: string;
  category: string;
  title: string;
  description: string;
  badge: string;
  accentColor: string;
  gradientBg: string;
  iconBg: string;
  sealIcon?: React.ReactNode;
  renderIllustration: () => React.ReactNode;
  linkTo?: string;
  linkText?: string;
}

interface CoverflowCarouselProps {
  items: CoverflowItem[];
  title?: string;
  subtitle?: string;
  tagline?: string;
  defaultIndex?: number;
  className?: string;
}

export function CoverflowCarousel({
  items,
  title,
  subtitle,
  tagline,
  defaultIndex = 1,
  className = "",
}: CoverflowCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const total = items.length;

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Keyboard navigation when focused
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      prevSlide();
    } else if (e.key === "ArrowRight") {
      nextSlide();
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden py-12 md:py-16 select-none ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Features 3D Carousel"
    >
      {/* Header if provided */}
      {(title || subtitle || tagline) && (
        <div className="mx-auto max-w-3xl text-center px-6 mb-12">
          {tagline && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="h-3 w-3" />
              {tagline}
            </span>
          )}
          {title && (
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* 3D Coverflow Container */}
      <div
        className="relative mx-auto flex items-center justify-center min-h-[500px] md:min-h-[540px] px-4"
        style={{ perspective: "1200px" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrow Left */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-40 h-11 w-11 md:h-12 md:w-12 rounded-full border border-border/80 bg-background/90 dark:bg-card/90 backdrop-blur-md shadow-xl flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>

        {/* Navigation Arrow Right */}
        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-40 h-11 w-11 md:h-12 md:w-12 rounded-full border border-border/80 bg-background/90 dark:bg-card/90 backdrop-blur-md shadow-xl flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
        </button>

        {/* Carousel Cards Track */}
        <div
          className="relative w-full max-w-5xl h-[480px] md:h-[500px] flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {items.map((item, index) => {
            // Calculate cyclic distance
            let offset = (index - activeIndex + total) % total;
            if (offset > total / 2) offset -= total;

            const isCenter = offset === 0;
            const isVisible = Math.abs(offset) <= 2;

            // Geometry calculations
            const xOffsetDesktop = offset * 250;
            const xOffsetMobile = offset * 140;
            const xOffset = isMobile ? xOffsetMobile : xOffsetDesktop;

            const rotateY = offset * -26; // rotate towards center
            const zTranslate = isCenter ? 60 : -Math.abs(offset) * 80;
            const scale = isCenter ? 1 : Math.max(0.72, 1 - Math.abs(offset) * 0.14);
            const opacity = isCenter ? 1 : Math.max(0, 0.95 - Math.abs(offset) * 0.35);
            const zIndex = 30 - Math.abs(offset) * 10;

            return (
              <div
                key={item.id}
                onClick={() => !isCenter && setActiveIndex(index)}
                className={`absolute w-[285px] sm:w-[320px] md:w-[350px] h-[450px] md:h-[480px] rounded-3xl bg-card border border-border/70 p-6 md:p-7 flex flex-col justify-between transition-all duration-500 ease-out cursor-pointer ${
                  isCenter
                    ? "shadow-2xl shadow-primary/10 ring-1 ring-border/80"
                    : "shadow-xl hover:opacity-100"
                }`}
                style={{
                  transform: `translateX(${xOffset}px) translateZ(${zTranslate}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity: isVisible ? opacity : 0,
                  zIndex: zIndex,
                  pointerEvents: isVisible ? "auto" : "none",
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
              >
                {/* Card Top: Graphic / Illustration Box */}
                <div
                  className={`relative w-full h-44 sm:h-52 md:h-56 rounded-2xl overflow-hidden p-4 flex items-center justify-center ${item.gradientBg}`}
                >
                  {/* Organic fluid background blob */}
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.8),transparent_70%)]" />

                  {/* Feature Custom Illustration */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                    {item.renderIllustration()}
                  </div>

                  {/* Circular Emblem / Seal on bottom right (matching screenshot style) */}
                  <div className="absolute bottom-2.5 right-2.5 z-20 h-10 w-10 md:h-11 md:w-11 rounded-full bg-white dark:bg-card border-2 border-primary/20 shadow-md flex items-center justify-center p-1">
                    <div className="h-full w-full rounded-full border border-dashed border-primary/40 flex items-center justify-center text-primary text-xs font-black">
                      {item.sealIcon || "✦"}
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Content info */}
                <div className="pt-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-foreground leading-snug">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  </div>

                  {/* Card Action Link */}
                  {item.linkTo && (
                    <div className="pt-3 border-t border-border/40 mt-3 flex items-center justify-between text-xs font-bold text-primary hover:underline">
                      <span>{item.linkText || "Learn more"}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dot Indicators */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              i === activeIndex
                ? "h-2.5 w-8 bg-primary"
                : "h-2 w-2 bg-border hover:bg-muted-foreground/60"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
