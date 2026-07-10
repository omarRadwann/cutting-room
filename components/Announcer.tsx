"use client";

import { useEffect, useState } from "react";
import { _setAnnouncer } from "@/lib/announce";

/**
 * The single polite ARIA live region for the whole app. Mount ONCE in layout.tsx. Any component calls
 * announce("…") (lib/announce.ts) and it's read aloud — the bridge between a scroll-driven, aria-hidden
 * canvas experience and a screen-reader user. Lives outside any aria-hidden wrapper so it always fires.
 */
export default function Announcer() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    _setAnnouncer(setMessage);
    return () => _setAnnouncer(null);
  }, []);
  return (
    <div aria-live="polite" role="status" className="sr-only">
      {message}
    </div>
  );
}
