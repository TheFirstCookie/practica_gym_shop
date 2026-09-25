import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

// The preview shown when a link to the shop is shared (chat apps, social posts). Product
// pages use their own photo instead; see generateMetadata in product/[slug]/page.tsx.

export const alt = `${SITE_NAME}: gym and sport equipment`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse can't read woff2, so the display face ships once more as woff for this.
const anton = readFile(join(process.cwd(), "app/fonts/anton-latin-400.woff"));

// Same values as the tokens in globals.css (ImageResponse can't read CSS variables).
const colors = {
  page: "#0e0c0a",
  text: "#f6f0e6",
  muted: "#a89d8d",
  brand: "#ff6b1a",
  line: "#352f28"
};

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: colors.page,
          borderTop: `12px solid ${colors.brand}`,
          color: colors.text
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 40, fontFamily: "Anton" }}>
          <div style={{ width: 56, height: 56, background: colors.brand }} />
          <span>
            FORGEFIT <span style={{ color: colors.brand, marginLeft: 14 }}>SUPPLY</span>
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", fontFamily: "Anton", fontSize: 100, lineHeight: 1 }}>
          <span>BUILD THE ROOM</span>
          <span>BEFORE THE ROUTINE BREAKS.</span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 36,
            paddingTop: 28,
            borderTop: `2px solid ${colors.line}`,
            color: colors.muted,
            fontSize: 30
          }}
        >
          <span>Gym and sport equipment</span>
          <span style={{ color: colors.brand }}>15-day shipping</span>
          <span>30-day returns</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Anton", data: await anton, style: "normal", weight: 400 }]
    }
  );
}
