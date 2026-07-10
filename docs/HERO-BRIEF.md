# The Cutting Room — Hero Film Brief
### The one film that opens the site (you make it; it's already wired in)

The hero is now its **own full-screen film** (not a drum panel). It owns the first screen, then **fades
to reveal the drum** as you scroll. Drop your file in and it lights up automatically — until then the
drum's front film covers the hero, so the site is never broken.

**Where it plugs in:** save your export as
`public/media/hero.mp4` (H.264/MP4) and a first-frame still as `public/media/hero.webp`.
That's it — `components/HeroVideo.tsx` already loads it, plays it muted/looping, fades it on scroll,
and pauses it once you've entered the reel.

So it must: (1) read **instantly as premium studio craft**, (2) **loop seamlessly** (first frame ≈ last
frame — it plays forever), (3) hold up **cover-cropped** — it's `object-fit: cover`, so keep the key
action in the **centre** and safe for both wide desktop and tall phone, and (4) feel like a **studio
signature**, not one campaign.

**Format:** **16:9 landscape**, ideally 3840×2160 (or 2.39:1 cinematic with the action centred) ·
**8–14 s** · seamless loop · silent or a low sub-bass hum · anamorphic feel (oval bokeh, a hint of
horizontal flare, fine 35 mm grain).
**Palette (match the site):** near-black `#07070b` ground · warm gold `#d8a24a` key · one cool
`#6f9fc4` monitor-blue rim. Grade warm; protect the highlights.

---

## ▶ Recommended — "THE CUTTING ROOM" (the studio, at work)
What you asked for: a hero that literally *is* the cutting room — the craft, not an abstract texture.
A slow, cinematic drift through a darkened **editing / colour-grading suite** at work: the glow of a
timeline and **scopes** (waveform / vectorscope / RGB parade) breathing on a monitor; a hand resting on
a **grading control surface** (trackballs lit warm); a projector-style **beam raking through dust**; a
**film strip / reel** catching a sliver of light in the foreground. One patient push-in, no cuts. A face
half-lit by monitor light is welcome — it adds the human, "a real studio" feeling.
- **Why:** it sells the positioning in three seconds — a full operating studio that *directs, cuts and
  grades in-house* — and it gives the warmer, more human feeling you're after. It frames beautifully
  full-bleed and recedes cleanly as the drum takes over.
- **Camera:** locked or a slow dolly/push (≤8%). Weighty, unhurried.
- **Light:** motivated by the screens — warm gold key, cool monitor-blue rim, everything else to black.
- **Make it (generate):** *"cinematic slow push through a dark high-end film colour-grading suite,
  glowing timeline and waveform/vectorscope on a wide monitor, a hand on a lit grading trackball panel,
  a projector beam raking through floating dust, a film reel catching light in the foreground, warm gold
  key with cool blue monitor rim, near-black room, anamorphic oval bokeh, fine 35 mm grain, shallow
  depth of field, seamless loop, 16:9, 4K."*  Finish in After Effects / DaVinci for flare, grain, grade.
- **Make it (shoot):** any dark room, one warm practical + a screen for the blue rim, a macro of a reel
  or a hand on a controller. Keep it slow and shallow.

## ▷ Alternate A — "THE TIMELINE"
Extreme macro of a **film strip / reel spooling through light** — frames flickering past the gate,
splice tape, sprocket holes glinting, dust in the beam. Most abstract of the on-theme options; reads as
pure "cutting room" and loops effortlessly.

## ▷ Alternate B — "THE GRADE"
Tight on a **colourist's panel**: trackballs glowing, scopes pulsing, a monitor's light washing a face.
The most "operator at the controls" option — human, precise, premium.

---

**My pick:** **THE CUTTING ROOM** — it's the concept, the positioning and the warmer feeling in one
shot. Keep the hero action centred (cover-crop), loop it clean, and I'll pull its grade colour into the
room's light-pool so the hero and the reel feel like one world. Name it `hero.mp4` (+ `hero.webp`) and
it goes live the moment you drop it in.
