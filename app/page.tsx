"use client";

import { Suspense } from "react";
import Scene from "@/components/Scene";
import HeroVideo from "@/components/HeroVideo";
import Preloader from "@/components/Preloader";
import DebugOverlay from "@/components/DebugOverlay";
import { ExperienceBoundary } from "@/components/ExperienceBoundary";
import { Kinetic } from "@/components/Kinetic";
import SiteNav from "@/components/SiteNav";
import Hud from "@/components/Hud";
import GradeWash from "@/components/GradeWash";
import FocusOverlay from "@/components/FocusOverlay";
import FilmIndex from "@/components/FilmIndex";
import UIState from "@/components/UIState";
import AudioLayer from "@/components/AudioLayer";
import WorkProcess from "@/components/WorkProcess";
import { STILLS } from "@/lib/content";
import { withBase } from "@/lib/withBase";

/**
 * "The Cutting Room" — a drum of vertical films.
 *  Fixed WebGL layer (the drum) sits behind; the DOM below is the scroll driver: its height scrubs
 *  the drum's rotation. Nav / HUD / focus overlays float on top; the grade-wash tints the room.
 */
export default function Page() {
  return (
    <>
      <Preloader />
      <DebugOverlay />{/* hidden unless ?debug=1 / Shift+D */}

      {/* the interactive WebGL drum (behind everything) */}
      <div className="webgl-fixed">
        <ExperienceBoundary>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </ExperienceBoundary>
      </div>

      {/* bespoke hero film (fades to reveal the drum; self-hides until you supply /media/hero.mp4) */}
      <HeroVideo />

      {/* atmosphere + phase driver */}
      <UIState />
      <AudioLayer />
      <GradeWash />
      <div className="hero-scrim" aria-hidden="true" />
      <div className="cine-bar top" aria-hidden="true" />
      <div className="cine-bar bot" aria-hidden="true" />
      <div className="filmic" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="prog-hair" aria-hidden="true" />

      {/* chrome */}
      <SiteNav />
      <Hud />
      <FilmIndex />
      <FocusOverlay />
      <div className="hint" aria-hidden="true">drag · scroll · click</div>
      <div className="hero-cue" aria-hidden="true">Roll the reel</div>

      {/* DOM scroll-driver + crawlable content */}
      <main id="main" className="content">
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-eyebrow">Selected work — film · motion · 3D</div>
            {/* the rise is PAUSED by CSS until the preloader lifts (html[data-entered]) — plays in view, always */}
            <Kinetic as="h1" className="hero-title" text="The Cutting Room" by="word" trigger="load" delay={0.15} />
            <div className="hero-ar" dir="rtl">غرفة المونتاج</div>
            <p className="hero-tag">
              Cinematic film for architecture, fashion and product. Turn the drum to browse the
              reel — click any frame to step inside.
            </p>
          </div>
        </section>

        {/* scroll length that scrubs the drum through the reel (620vh: browsing ends at p0.50, the room
            recedes from 0.53, and the heading arrives ~0.56 over the DIMMED stage — plus a breath between
            the reel and the process. Calibrated against the Outfit reflow; re-check if card copy changes) */}
        <div style={{ height: "620vh" }} aria-hidden="true" />

        <WorkProcess />

        <section className="colophon">
          <h2 className="colo-statement" data-reveal aria-label="Every frame is directed, not merely generated.">
            <span className="kin-mask" aria-hidden="true"><span className="kin-piece" style={{ ["--i" as string]: 0 } as React.CSSProperties}>Every frame is <em>directed</em>,</span></span>
            <br />
            <span className="kin-mask" aria-hidden="true"><span className="kin-piece" style={{ ["--i" as string]: 1 } as React.CSSProperties}>not merely generated.</span></span>
          </h2>
          <p className="colo-lead">
            A cinematic advertising studio — directed, modelled, lit and graded in-house.
            Blender,&nbsp;Cinema&nbsp;4D and Houdini for the build; After&nbsp;Effects and DaVinci for the
            finish. Eleven films here; the full reel on request.
          </p>

          <div className="strip" data-reveal style={{ transitionDelay: ".08s" }}>
            {STILLS.map((s) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={s.slug} src={withBase(s.thumb)} alt={`${s.title} — ${s.campaign}`} decoding="async" />
            ))}
          </div>

          <div className="colo-row" data-reveal style={{ transitionDelay: ".16s" }}>
            <p className="colo-lead">
              Available for commissions — product films, brand campaigns and cinematic stills.
              Based in Cairo, working worldwide.
            </p>
            <a className="colo-cta" href="mailto:omarmoha1999@gmail.com" data-clickable data-magnetic data-cursor>
              Start a project<span className="cta-orb" aria-hidden="true">→</span>
            </a>
          </div>

          <div className="foot">
            <span>Cairo — القاهرة</span>
            <span className="mono2">THE CUTTING ROOM · MMXXVI</span>
          </div>
        </section>
      </main>
    </>
  );
}
