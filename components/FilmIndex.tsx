"use client";
import { useUI, setFocus } from "@/lib/ui-store";
import { CLIPS } from "@/lib/content";

/** A clickable index of the films (right rail). Shows the current film; click to step into any. */
export default function FilmIndex() {
  const ui = useUI();
  const active = ui.focus ?? ui.front;
  return (
    <nav className="film-index" aria-label="Films in the reel">
      {CLIPS.map((c, i) => (
        <button
          key={c.slug}
          className={`fi-item${i === active ? " is-active" : ""}`}
          data-clickable
          data-cursor
          onClick={() => setFocus(i)}
          aria-current={i === active ? "true" : undefined}
        >
          <span className="fi-n mono2">{String(i + 1).padStart(2, "0")}</span>
          <span className="fi-t">{c.title}</span>
        </button>
      ))}
    </nav>
  );
}
