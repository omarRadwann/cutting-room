"use client";
import { Kinetic } from "@/components/Kinetic";
import Marquee from "@/components/Marquee";
import { STILLS } from "@/lib/content";
import { withBase } from "@/lib/withBase";

// The pipeline as a TIMELINE — eight cuts on a fifteen-second master. Real studio phases, real tools.
const STEPS = [
  { n: "01", tc: "00:00", phase: "Development",     t: "Brief & Discovery",      d: "We start with the goal, the audience and the constraint — then agree what 'done' looks like before a single frame is made.", tools: ["Deck", "References", "Call"] },
  { n: "02", tc: "00:02", phase: "Development",     t: "Concept & Storyboard",   d: "The idea, written and drawn. Script, boards and style-frames lock the tone so nothing is left to guess downstream.",        tools: ["Photoshop", "Procreate", "Figma"] },
  { n: "03", tc: "00:04", phase: "Pre-Production",  t: "Previs",                 d: "Rough 3D blocking — camera, timing and coverage — so the edit already works before we spend a render hour.",                 tools: ["Blender", "Cinema 4D"] },
  { n: "04", tc: "00:06", phase: "Production",      t: "Model & Look-dev",       d: "Assets built and dressed; materials, textures and lighting studies pushed until the look matches the boards.",               tools: ["Blender", "Houdini", "Substance", "Megascans"] },
  { n: "05", tc: "00:08", phase: "Production",      t: "Animation & Simulation", d: "Motion with weight — keyframe, camera, and the sims (cloth, fluids, crowds, destruction) that make it read real.",            tools: ["Blender", "Houdini", "Marvelous Designer"] },
  { n: "06", tc: "00:11", phase: "Production",      t: "Lighting & Render",      d: "Final lighting, motivated and graded-for. Rendered in passes on the farm so nothing is baked in too early.",                 tools: ["Octane", "Redshift", "Karma"] },
  { n: "07", tc: "00:13", phase: "Post-Production", t: "Composite & Grade",      d: "Passes assembled, cleanup and VFX, then the colour grade and sound design that give the film its skin.",                     tools: ["After Effects", "Nuke", "DaVinci Resolve"] },
  { n: "08", tc: "00:15", phase: "Delivery",        t: "Delivery",               d: "Masters and every cut-down the channels need — ratios, durations, captions — QC'd, wrapped and shipped.",                   tools: ["Media Encoder", "DaVinci"] },
];

// Corridor hang order (indexes into STILLS): paired to each stage's MEANING and paced by measured
// luminance (L60–L168) so darks sit mid-corridor and it exits on the warm gold "delivered gift".
// 01 Brief→crystal(keyframe) 02 Concept→luxor(the show) 03 Previs→diamond(placing the stone)
// 04 Look-dev→tote(product portrait) 05 Animation→desert(the walk) 06 Lighting→temple(god-rays)
// 07 Grade→qurashi(the graded flacon) 08 Delivery→bouquet(the gift)
const CORRIDOR_ORDER = [7, 0, 1, 5, 2, 4, 3, 6];

/** The studio pipeline as an edit-bay timeline: a centre spine that lights up cut by cut, timecode
 *  markers, phase tags, ghost numerals — and it RESOLVES to a delivered master (never a dead end). */
export default function WorkProcess() {
  return (
    <section className="work" id="process">
      {/* the kinetic band announces the section over the dimmed stage — speed & skew ride your scroll */}
      <Marquee />
      <div className="work-head">
        <div className="work-head-l">
          <div className="eyebrow" data-reveal>How we work — كيف نعمل</div>
          <Kinetic as="h2" className="work-title" text="From brief to master, in eight moves." by="word" trigger="scroll" />
        </div>
        <p className="work-lead" data-reveal>
          The way a working studio actually runs — every stage has an owner, a deliverable and a
          sign-off, so the film lands on time and on look. Eight cuts on one timeline.
        </p>
      </div>

      <ol className="tl">
        {STEPS.map((s, i) => {
          const still = STILLS[CORRIDOR_ORDER[i]]; // every stage hangs a MEANING-matched frame from the work
          return (
            <li className="tl-step" key={s.n} data-reveal style={{ transitionDelay: `${(i % 2) * 0.06}s` }}>
              <div className="tl-rail" aria-hidden="true"><span className="tl-dot" /></div>
              <article className="tl-card">
                <span className="tl-ghost" aria-hidden="true">{s.n}</span>
                <div className="tl-meta mono2">
                  <span className="tl-tc">TC {s.tc}</span>
                  <span className="tl-phase">{s.phase}</span>
                </div>
                <h3 className="tl-title">{s.t}</h3>
                <p className="tl-d">{s.d}</p>
                <div className="tl-chips">
                  {s.tools.map((t, j) => <span className="chip" key={t} style={{ ["--i" as string]: j } as React.CSSProperties}>{t}</span>)}
                </div>
              </article>
              {still && (
                // the gallery corridor: a printed frame from the reel hangs opposite each card
                <figure className="tl-still">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={withBase(still.thumb)} alt={`${still.title} — ${still.campaign}`} loading="lazy" decoding="async" />
                  <figcaption className="mono2">STILL · {still.title.toUpperCase()}</figcaption>
                </figure>
              )}
            </li>
          );
        })}
        {/* the timeline resolves — the master ships (a lit destination, never a dead end) */}
        <li className="tl-step tl-end" data-reveal>
          <div className="tl-rail" aria-hidden="true"><span className="tl-dot tl-dot-end" /></div>
          <div className="tl-final mono2">MASTER · DELIVERED — 00:00:15:00</div>
        </li>
      </ol>
    </section>
  );
}
