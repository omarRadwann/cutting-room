"use client";

import { Component, type ReactNode } from "react";

/**
 * Robustness net around the 3D layer. Pattern harvested from a shipped award build (ELECTRICO).
 * If WebGL is unavailable or the renderer/shaders throw, drop the experience instead of crashing the
 * page — the real, crawlable DOM content (the <main> sibling in page.tsx) keeps rendering on the base
 * background, so the site degrades gracefully on weak / old / headless / blacklisted-GPU environments.
 * Wrap ONLY the <Canvas> (or its <Suspense>) — never wrap <main>, or a 3D error would also blank the
 * content. This is the a11y/SEO safety floor: content survives even when WebGL doesn't.
 */
export class ExperienceBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[3D] experience disabled (rendering content only):", error);
    }
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default ExperienceBoundary;
