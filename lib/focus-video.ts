// The focused film's live <video> element — set by ActiveVideo while its panel is focused, read by
// FocusOverlay's timecode scrubline (TC readout + progress hairline). Module singleton, no React state.
export const focusVideo = { el: null as HTMLVideoElement | null };
