import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h / 6, s, l];
}

function hslToHex(h: number, s: number, l: number) {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function boostColor(r: number, g: number, b: number, darken = false): string {
  const [h, s, l] = rgbToHsl(r, g, b);
  const boostedS = Math.min(s + 0.35, 1);
  const adjustedL = darken ? Math.max(l - 0.15, 0.1) : Math.min(l, 0.6);
  return hslToHex(h, boostedS, adjustedL);
}

export async function GET(req: NextRequest) {
  const imageUrl = req.nextUrl.searchParams.get("imageUrl");
  if (!imageUrl) return NextResponse.json({ gradient: null });

  try {
    const imageRes = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "image/*" },
    });

    if (!imageRes.ok) return NextResponse.json({ gradient: null });

    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, info } = await sharp(buffer)
      .resize(60, 60, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const channels = 3;

    function sampleBand(xStart: number, xEnd: number) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let y = 0; y < height; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const i = (y * width + x) * channels;
          r += data[i]!;
          g += data[i + 1]!;
          b += data[i + 2]!;
          count++;
        }
      }
      return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
    }

    const third = Math.floor(width / 3);
    const c1 = sampleBand(0, third);
    const c2 = sampleBand(third, third * 2);
    const c3 = sampleBand(third * 2, width);

    const hex1 = boostColor(c1.r, c1.g, c1.b, true);
    const hex2 = boostColor(c2.r, c2.g, c2.b);
    const hex3 = boostColor(c3.r, c3.g, c3.b, true);

    return NextResponse.json({
      gradient: `linear-gradient(to right, ${hex1}, ${hex2}, ${hex3})`,
    });
  } catch (err) {
    console.error("[extract-colors] failed:", err);
    return NextResponse.json({ gradient: null });
  }
}