import localFont from "next/font/local";

// Self-hosted fonts (SIL Open Font License, see the LICENSE files here).
// next/font preloads them and generates a size-matched fallback, so every visitor
// gets the same type and the layout doesn't jump while they load. The files are
// in the repo, so builds never depend on reaching Google Fonts.
// Each font exposes a CSS variable that globals.css builds its font stacks from.

// Condensed display face for the big uppercase headings.
export const displayFont = localFont({
  src: "./anton-latin-400.woff2",
  weight: "400",
  variable: "--font-display",
  display: "swap"
});

// Variable font, so every weight the UI uses (400–900) comes from one file.
export const bodyFont = localFont({
  src: "./archivo-latin-variable.woff2",
  weight: "100 900",
  variable: "--font-body",
  display: "swap"
});
