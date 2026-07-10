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
      <div className="filmic" aria-hidden="true" />

      {/* chrome */}
      <SiteNav />
      <Hud />
      <FilmIndex />
      <FocusOverlay />
      <div className="hint" aria-hidden="true">drag · scroll · click</div>
      <div className="hero-cue" aria-hidden="true">Scroll to enter</div>

      {/* DOM scroll-driver + crawlable content */}
      <main id="main" className="content">
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-eyebrow">Selected work — film · motion · 3D</div>
            {/* delayed so the word-rise plays AS the preloader lifts, not hidden behind it */}
            <Kinetic as="h1" className="hero-title" text="The Cutting Room" by="word" trigger="load" delay={0.85} />
            <div className="hero-ar" dir="rtl">غرفة المونتاج</div>
            <p className="hero-tag">
              Cinematic film for architecture, fashion and product. Turn the drum to browse the
              reel — click any frame to step inside.
            </p>
          </div>
        </section>

        {/* scroll length that scrubs the drum through the reel */}
        <div style={{ height: "480vh" }} aria-hidden="true" />

        <WorkProcess />

        <section className="colophon">
          <h2 className="colo-statement" data-reveal>
            Every frame is <em>directed</em>,<br />not merely generated.
          </h2>
          <p className="colo-lead">
            A cinematic advertising studio — directed, modelled, lit and graded in-house.
            Blender,&nbsp;Cinema&nbsp;4D and Houdini for the build; After&nbsp;Effects and DaVinci for the
            finish. Ten films here; the full reel on request.
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
              Start a project&nbsp;→
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
