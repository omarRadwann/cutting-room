"use client";
// Tiny external store shared across the canvas/DOM boundary (like scroll-store, but reactive
// for DOM HUD). Only integer/boolean state that changes rarely lives here — never per-frame floats
// (those stay in scroll-store / refs) so React doesn't re-render every frame.
import { useSyncExternalStore } from "react";

export type UIState = {
  focus: number | null; // focused clip index (null = browsing the drum)
  front: number;        // clip index currently at the front of the drum
  muted: boolean;       // global audio mute
  entered: boolean;     // preloader dismissed / experience entered
  intro: boolean;       // hero video is covering the screen (don't also decode a drum video behind it)
};

let state: UIState = { focus: null, front: 0, muted: true, entered: false, intro: true };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const getUI = () => state;
export function setFocus(i: number | null) { if (state.focus !== i) { state = { ...state, focus: i }; emit(); } }
export function setFront(i: number) { if (state.front !== i) { state = { ...state, front: i }; emit(); } }
export function toggleMuted() { state = { ...state, muted: !state.muted }; emit(); }
export function setEntered(b: boolean) { if (state.entered !== b) { state = { ...state, entered: b }; emit(); } }
export function setIntro(b: boolean) { if (state.intro !== b) { state = { ...state, intro: b }; emit(); } }

function subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; }
export function useUI(): UIState { return useSyncExternalStore(subscribe, () => state, () => state); }

// verify hook: drive focus from a headless script
if (typeof window !== "undefined") { (window as unknown as Record<string, unknown>).__setFocus = setFocus; }
