// Tiny module singleton so any component can push a screen-reader message into the ONE polite live
// region (mounted once via <Announcer/> in layout). Pattern harvested from a shipped build's cart
// announcer, generalized to any state change — section entered, filter applied, audio toggled, etc.
// The canvas is aria-hidden, so scroll-driven "route" changes are otherwise silent to a screen reader;
// announce() is how you give them a voice.  Usage:  announce("Chapter 2 — the reveal");
type Listener = (message: string) => void;

let listener: Listener | null = null;

export function announce(message: string): void {
  listener?.(message);
}

// internal — wired by <Announcer/> on mount/unmount
export function _setAnnouncer(l: Listener | null): void {
  listener = l;
}
