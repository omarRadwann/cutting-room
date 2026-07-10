"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/reduced-motion";

/**
 * Kinetic headline — masked split-text that rises word-by-word (or char-by-char) on reveal.
 * Pattern harvested from a shipped award build (ÉTHEREAL): CSS-driven so it runs on the compositor
 * (immune to rAF/focus throttling and to the single-clock loop), triggered by IntersectionObserver,
 * SSR-deterministic, and accessible — the real text is the tag's `aria-label`, the animated pieces are
 * `aria-hidden`. Drives the `.kin-*` rules in globals.css.
 *
 *   <Kinetic as="h1" text="Scent, made visible" by="word" trigger="load" />
 *   <Kinetic as="h2" text="The collection" by="char" delay={0.1} />
 *
 * The 2D craft layer (non-negotiable #4): razor-sharp DOM type over the 3D. See references/motion-language.md
 * for the GSAP SplitText alternative when you need scrubbed (scroll-linked) type.
 */
export function Kinetic({
  text,
  as: Tag = "span",
  by = "word",
  className,
  style,
  delay = 0,
  stagger,
  duration = 0.9,
  trigger = "scroll",
}: {
  text: string;
  as?: keyof React.JSX.IntrinsicElements;
  by?: "word" | "char";
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  stagger?: number;
  duration?: number;
  trigger?: "scroll" | "load";
}) {
  const ref = useRef<HTMLElement>(null);
  const words = text.split(" ");
  const stg = stagger ?? (by === "char" ? 0.03 : 0.07);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || trigger === "load") {
      // reduced-motion: CSS pins pieces visible. load: reveal next frame so masked state paints first.
      const id = requestAnimationFrame(() => el.classList.add("kin-go"));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("kin-go");
            io.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [trigger]);

  let idx = 0;
  const vars = {
    ...style,
    ["--kd" as string]: `${duration}s`,
    ["--ks" as string]: `${stg}s`,
    ["--kdelay" as string]: `${delay}s`,
  } as React.CSSProperties;

  return (
    // @ts-expect-error polymorphic tag ref
    <Tag ref={ref} className={`kinetic ${className ?? ""}`} style={vars} aria-label={text}>
      {words.map((word, wi) => (
        <span
          key={wi}
          aria-hidden
          className="kin-mask"
          style={{ marginRight: wi < words.length - 1 ? "0.26em" : 0 }}
        >
          {by === "char" ? (
            word.split("").map((ch, ci) => (
              <span key={ci} className="kin-piece" style={{ ["--i" as string]: idx++ } as React.CSSProperties}>
                {ch}
              </span>
            ))
          ) : (
            <span className="kin-piece" style={{ ["--i" as string]: idx++ } as React.CSSProperties}>
              {word}
            </span>
          )}
        </span>
      ))}
    </Tag>
  );
}

export default Kinetic;
