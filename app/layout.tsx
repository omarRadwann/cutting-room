import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit, Amiri, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";
import Announcer from "@/components/Announcer";

// Fraunces variable — request the optical-size, SOFT & WONK axes so the display face can run a true
// high-contrast 144pt cut on the hero and a calmer text cut on smaller headings (font-variation-settings).
const display = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz", "SOFT", "WONK"], variable: "--font-display", display: "swap" });
// Outfit replaces Inter (banned across the premium-design skills) — geometric warmth that suits the room
const body = Outfit({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const arabic = Amiri({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-ar", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

// metadataBase makes the relative OG image resolve to an absolute URL; set NEXT_PUBLIC_SITE_URL at deploy.
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://omarradwann.github.io/cutting-room";
const TITLE = "The Cutting Room — A Cinematic Film & Motion Studio";
const DESC = "A cinematic film, motion & 3D studio — architecture, fashion and product, directed, lit and graded in-house. Cairo, working worldwide.";
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: TITLE, template: "%s — The Cutting Room" },
  description: DESC,
  openGraph: {
    title: TITLE, description: DESC, type: "website", siteName: "The Cutting Room",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "The Cutting Room" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: ["/og.jpg"] },
};

export const viewport: Viewport = { themeColor: "#06080c" }; // mobile browser chrome matches the room

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${arabic.variable} ${mono.variable}`}>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <SmoothScroll>{children}</SmoothScroll>
        <CustomCursor />
        <Announcer />{/* the single ARIA live region — call announce("…") from anywhere (lib/announce.ts) */}
      </body>
    </html>
  );
}
