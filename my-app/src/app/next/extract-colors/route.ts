import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

function getLightness(r: number, g: number, b: number): number {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  return (Math.max(rn, gn, bn) + Math.min(rn, gn, bn)) / 2;
}

function avgColor(pixels: Array<{ r: number; g: number; b: number }>) {
  const len = pixels.length;
  return {
    r: Math.round(pixels.reduce((s, p) => s + p.r, 0) / len),
    g: Math.round(pixels.reduce((s, p) => s + p.g, 0) / len),
    b: Math.round(pixels.reduce((s, p) => s + p.b, 0) / len),
  };
}

export async function GET(req: NextRequest) {
  const imageUrl = req.nextUrl.searchParams.get("imageUrl");
  if (!imageUrl) return NextResponse.json({ gradient: null });

  try {
    const imageRes = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "image/*" },
    });

    if (!imageRes.ok) return NextResponse.json({ gradient: null });

    const buffer = Buffer.from(await imageRes.arrayBuffer());

    const { data, info } = await sharp(buffer)
      .resize(80, 80, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const total = info.width * info.height;
    const ch = 3;

    const pixels = Array.from({ length: total }, (_, i) => ({
      r: data[i * ch]!,
      g: data[i * ch + 1]!,
      b: data[i * ch + 2]!,
      l: getLightness(data[i * ch]!, data[i * ch + 1]!, data[i * ch + 2]!),
    })).sort((a, b) => a.l - b.l);

    const dark  = avgColor(pixels.slice(0, Math.floor(total * 0.25)));
    const light = avgColor(pixels.slice(Math.floor(total * 0.75)));

    const alpha = 0.72;
    const dc = `rgba(${dark.r}, ${dark.g}, ${dark.b}, ${alpha})`;
    const lc = `rgba(${light.r}, ${light.g}, ${light.b}, ${alpha})`;

    const gradient = `linear-gradient(to right, ${dc}, ${lc}, ${dc})`;

    return NextResponse.json({ gradient });
  } catch (err) {
    console.error("[extract-colors] failed:", err);
    return NextResponse.json({ gradient: null });
  }
}