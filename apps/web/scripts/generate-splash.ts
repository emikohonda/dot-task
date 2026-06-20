// apps/web/scripts/generate-splash.ts
// 使い方:
// cd apps/web
// pnpm tsx scripts/generate-splash.ts

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BACKGROUND_COLOR = "#0284c7";
const TEXT_COLOR = "#ffffff";
const LOGO_TEXT = ".TASK";

type SplashDevice = {
  key: string;
  label: string;
  cssWidth: number;
  cssHeight: number;
  dpr: number;
};

const DEVICES: SplashDevice[] = [
  {
    key: "iphone-11-pro-max",
    label: "iPhone 11 Pro Max（父）",
    cssWidth: 414,
    cssHeight: 896,
    dpr: 3,
  },
  {
    key: "iphone-16-pro",
    label: "iPhone 16 Pro（エミコ）",
    cssWidth: 402,
    cssHeight: 874,
    dpr: 3,
  },
];

const OUTPUT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/splash",
);

function buildSvg(width: number, height: number): string {
  const fontSize = Math.round(width * 0.12);

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${BACKGROUND_COLOR}" />
  <text
    x="50%"
    y="50%"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif"
    font-weight="800"
    letter-spacing="-2"
    font-size="${fontSize}"
    fill="${TEXT_COLOR}"
  >${LOGO_TEXT}</text>
</svg>`.trim();
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  console.log("layout.tsx の startupImage にそのまま貼れる内容:\n");

  for (const device of DEVICES) {
    const pxWidth = device.cssWidth * device.dpr;
    const pxHeight = device.cssHeight * device.dpr;
    const svg = buildSvg(pxWidth, pxHeight);
    const outPath = path.join(OUTPUT_DIR, `${device.key}.png`);

    await sharp(Buffer.from(svg)).png().toFile(outPath);

    console.log(`// ${device.label}`);
    console.log(`{
  url: "/splash/${device.key}.png",
  media:
    "(device-width: ${device.cssWidth}px) and (device-height: ${device.cssHeight}px) and (-webkit-device-pixel-ratio: ${device.dpr}) and (orientation: portrait)",
},\n`);

    console.log(`OK: ${outPath} (${pxWidth}x${pxHeight}px)\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
