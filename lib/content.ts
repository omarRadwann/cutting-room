// The curated reel. Only ≥10s, dynamic (multi-shot or big camera move) films — no static product
// clips. Each film carries its NATIVE aspect so the drum can show it un-distorted.
// Media paths are root-relative and MUST be wrapped in withBase() at the point of use.

export type Chapter = "PLACE" | "FIGURE" | "OBJECT";

export type Clip = {
  slug: string;
  title: string;
  chapter: Chapter;
  campaign: string;
  brief: string;
  tools: string;
  grade: string;  // hex — velocity wash + light-pool colour
  aspect: number; // width / height (16:9 ≈ 1.778, 9:16 ≈ 0.5625)
  src: string;
  poster: string;
};

export type Still = {
  slug: string; title: string; chapter: Chapter; campaign: string; brief: string; full: string; thumb: string;
};

const clip = (
  slug: string, title: string, chapter: Chapter, campaign: string, grade: string, brief: string, tools: string, aspect = 9 / 16
): Clip => ({ slug, title, chapter, campaign, grade, brief, tools, aspect,
  src: `/media/clips/${slug}.mp4`, poster: `/media/posters/${slug}.webp` });

const still = (
  slug: string, title: string, chapter: Chapter, campaign: string, brief: string
): Still => ({ slug, title, chapter, campaign, brief, full: `/media/stills/${slug}.webp`, thumb: `/media/stills/${slug}.thumb.webp` });

const W = 16 / 9, T = 9 / 16;

// order = the sequence around the drum (front-to-front as you scroll). Interleaved so aspect (W/T) and
// register (place / figure / object / concept) alternate — no two similar films ever sit side by side.
export const CLIPS: Clip[] = [
  clip("coast",        "The Coast",           "PLACE",  "Real-estate film", "#d99a4a", "A slow crane over the coast at golden hour; a district unfurls to the sea.", "Cinema 4D · Octane · After Effects · DaVinci", W),
  clip("crystal-city", "The Crystal City",    "FIGURE", "Concept film",     "#1f6f86", "A world of her own — the opening beat of an underwater crystal city.",       "Houdini · Octane · Nuke · DaVinci", T),
  clip("villa",        "The Villa",           "PLACE",  "Architecture",     "#5f93b0", "A minimalist sea-house — travertine, still water and an unbroken horizon.",  "Cinema 4D · Corona · After Effects", W),
  clip("procession",   "Procession",          "FIGURE", "Fashion film",     "#c69a52", "Anamorphic 35mm montage — the wearers move through golden light.",           "Blender · Marvelous Designer · After Effects", T),
  clip("afterdark",    "After Dark",          "PLACE",  "Real-estate film", "#e0a94a", "Twin towers alight over the marina, mirrored in still water.",               "Cinema 4D · Redshift · After Effects", W),
  clip("heritage-film","Heritage, in Motion", "OBJECT", "ZEE",              "#a8763c", "A fifteen-second brand film, held on its first and final frame.",            "Blender · After Effects · DaVinci Resolve", T),
  clip("groundwork",   "Groundwork",          "PLACE",  "Real-estate film", "#c8b48a", "A construction time-lapse; a skyline rises from bare shore.",                "Houdini · After Effects · DaVinci", W),
  clip("atelier",      "The Maker's Mark",    "OBJECT", "Product film",     "#b5824a", "Macro on the craft — suede, cork and one engraved buckle in raking light.",  "Blender · Substance · After Effects · DaVinci", T),
  clip("terrace",      "The Terrace",         "PLACE",  "Architecture",     "#7fa8c0", "A minimalist white terrace opens, unbroken, to the sea.",                    "Cinema 4D · Corona · After Effects", W),
  clip("reveal",       "The Reveal",          "PLACE",  "Real-estate film", "#cf9350", "A drone cranes back to unveil a whole golden-hour coast — lagoons and marina.", "Houdini · Octane · After Effects · DaVinci", W),
];

export const STILLS: Still[] = [
  still("still-luxor",   "Blue Hour",     "PLACE",  "STOLCH",       "The cube glows before the illuminated colonnade."),
  still("still-diamond", "The Setting",   "OBJECT", "Jewellery",    "Tweezers lower the oval diamond into open rose-gold prongs."),
  still("still-desert",  "The Wearers",   "FIGURE", "Fashion film", "Five outfits walk a backlit dune; only the light wears them."),
  still("still-qurashi", "Qurashi Blend", "OBJECT", "Perfume",      "The flacon caught in a single directional light."),
  still("still-temple",  "The Hall",      "PLACE",  "ZEE",          "A monumental sandstone hall, one great god-ray falling."),
  still("still-tote",    "Structured",    "OBJECT", "Handbag",      "A tall, narrow mini-tote as editorial product portrait."),
  still("still-bouquet", "Not Enough",    "OBJECT", "Chocolate",    "A chocolate-flower bouquet — flowers aren't enough."),
  still("still-crystal", "Keyframe",      "FIGURE", "Concept film", "The opening keyframe of the underwater crystal city."),
];

export const CHAPTERS: { key: Chapter; en: string; ar: string }[] = [
  { key: "PLACE",  en: "Place",  ar: "المكان" },
  { key: "FIGURE", en: "Figure", ar: "الإنسان" },
  { key: "OBJECT", en: "Object", ar: "التفصيل" },
];
