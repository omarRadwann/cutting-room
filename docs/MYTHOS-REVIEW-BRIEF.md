# FLOW — Best-in-Space Review Brief

> Paste this whole document as the first message of the review session.
> The only attachment needed: the live URL (plus screenshots if the session can't browse).

---

**Your role:** You are a merciless creative director, an Awwwards juror, and a senior WebGL engineer in one. Review this live production site pixel by pixel, beat by beat. Do not be polite. Do not grade on a curve. Every finding must carry evidence (exact scroll position or element) and a concrete, buildable fix.

**The site:** https://omarradwann.github.io/cutting-room/

**What it is:** The portfolio of **FLOW** — a Cairo-based cinematic film & motion studio. "**The Cutting Room**" is the name of the experience/place (a descriptor, not the brand). One continuous 3D soundstage: a rotating drum of 12 films inside a lit studio set, scroll-driven, with focus screenings, a process section, and a colophon.

**The single success criterion:** This site must read as **the best studio website in its space** — judged against the strongest premium production/motion studios and Site-of-the-Day-grade 3D experiences, not against average portfolios. Calibrate your scores to that bar: a 7 means "good portfolio," which is a FAIL for this goal. Reserve 9–10 for "beats the benchmarks."

**Hold it against these while reviewing** (open 2–3 in adjacent tabs):
- Production/motion studios: ManvsMachine (manvsmachine.com), Tendril (tendril.ca), BUCK (buck.co), ArtClass (artclass.tv), Somesuch (somesuch.co)
- WebGL/experience bar: lusion.co, igloo.inc, activetheory.net
- Ask of each comparison: what do THEY do in the first 10 seconds that we don't? What do WE do that they can't?

---

## How to drive it (it is a scroll-driven 3D world — do not skim it like a page)

- **Real GPU + focused browser tab required** (WebGL freezes in backgrounded tabs). Desktop Chrome first.
- The **loading screen intentionally holds ~4s** — a Blender-rendered 3D FLOW mark plays while the film reel buffers behind it. Judge it as a designed opening beat, not as latency.
- **Scroll slowly.** The choreography: p0% full-screen hero film → the reel assembles as the curtain lifts → browse (films front one by one, p≈5%→50%) → the room recedes (p53%+) → "How We Work" corridor → colophon + seal.
- **Beat map for precise stops:** film *i* of 12 takes the front at ≈ `p = 5% + 45%·(i−1)/11` (so film 1 ≈ 5%, film 5 ≈ 21%, film 9 ≈ 38%, film 12 ≈ 50%). The marquee + section heading arrive ≈ 56%; corridor ≈ 66–86%; colophon ≈ 92–100%.
- **Interact:** DRAG the drum (it rests where you leave it — deliberate "free-rest," not a missing snap). CLICK any film → focus screening (arrow keys / on-screen arrows / Esc; note the timecode scrubline). Toggle SOUND (procedural, opt-in by design). Hover everything: cursor, magnetics, index, stills.
- **Inspection knobs:** `?debug=1` (tier/DPR/FPS/draw-call overlay, or Shift+D) · `?tier=high|standard|safe` (quality tiers — **the target machine is STANDARD = Intel Iris Xe iGPU**) · `?posters=1` (poster stills instead of live video).
- **Mobile:** test ≈390px width (steppers replace the film index; nav CTA moves to the colophon).
- **Also check:** reduced-motion mode, tab-through focus states, the browser tab title/favicon, and the OG share card (paste the URL into a social-card previewer).

## Score these 14 axes, 1–10, each with one line of evidence

1. **First impression (0–5s)** — loader + first frame authority
2. **Concept & narrative spine** — is "a studio's cutting room" carried from loader to colophon?
3. **Brand system** — FLOW ↔ The Cutting Room hierarchy, bilingual EN/AR voice, seal, consistency
4. **Typography** — scale hierarchy, pairing (Fraunces/Outfit/Amiri/mono), micro-typography
5. **Composition per beat** — figure/ground, negative space, collisions at every stop on the beat map
6. **3D craft** — lighting, materials, set believability, the baked-GI shell, floor, atmosphere
7. **Motion & transitions** — changeovers, the dissolve, title-card rises, camera choreography, easing signature
8. **The signature interaction** — the drum + free-rest + focus dolly: is it screenshot-worthy and *ownable*?
9. **Film presentation & curation** — order, grades re-lighting the room, aspect rhythm, per-film worlds
10. **Copy & microcopy** — voice, "Roll the reel," captions, placards, credits (no filler?)
11. **UX, wayfinding & a11y** — always know where you are / what to do next; keyboard; contrast; announcements
12. **Performance FEEL on STANDARD tier** — smoothness during scroll, drag, focus-open, film-switch; name the exact moment of any hitch
13. **Craft details** — cursor, loader %, marquee, corridor stills, seal edges, scrollbar, selection, favicon, OG card
14. **Commission-readiness** — would a brand CMO shortlist this studio from this site alone?

## Output format

1. **Scorecard table** — axis / score / one-line evidence.
2. **Verdict** — would this win SOTD today, yes/no/why; would a CMO shortlist the studio?
3. **Findings, ranked P0 / P1 / P2** — each: what, where (scroll % or element), why it hurts at this bar, and the concrete fix.
4. **The last 10%** — the five moves that would take it from strong to *unbeatable in its space*.
5. **Do-not-break list** — what is already world-class and must survive future changes.

## Hard constraints (recommendations violating these are useless)

- **Positioning:** a full operating studio. Craft is credited to Blender, Cinema 4D, Houdini, After Effects, DaVinci. **Never** suggest crediting, hinting at, or watermarking AI-generation tools anywhere.
- **No fabricated client names, logos, or awards.** (Real client naming is a pending owner decision — treat it as out of scope.)
- **Solo builder + code assistant; static GitHub Pages hosting (no backend); budget = days, not months.** Prefer fixes executable in that envelope; mark anything larger as "strategic."
- **Performance target:** 60fps-feel on an Intel Iris Xe at STANDARD tier. Any visual recommendation must state its GPU cost.
- **Brand locked:** FLOW = studio name; "The Cutting Room" = experience descriptor. Keep both; don't propose renames.
- **The 12 films are the current asset set.** Re-ordering, re-grading, trimming allowed; "commission new footage" is allowed only as a clearly-marked strategic item (a shot brief is welcome).
- **Contact stays** omarmoha1999@gmail.com, email-only CTA.

## Known deliberate choices (don't spend findings on these — critique their *execution*, not their existence)

- The ~4s loader (it genuinely buffers the reel), the free-rest drum, opt-in sound, films at museum distance in browse (the title cards carry the scale), the Arabic bilingual layer, and the letterboxed hero.

## Known open items awaiting owner decisions (push past them)

- Ambient music bed (needs a licensed track), real client naming on films, Awwwards submission package.
