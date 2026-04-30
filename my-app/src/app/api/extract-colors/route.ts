import { NextRequest, NextResponse } from "next/server";
import { Vibrant } from "node-vibrant/node";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const imageUrl = req.nextUrl.searchParams.get("imageUrl");
  if (!imageUrl) {
    return NextResponse.json({ gradient: null });
  }

  try {
    const imageRes = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "image/*",
      },
    });

    if (!imageRes.ok) {
      return NextResponse.json({ gradient: null });
    }

    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const palette = await Vibrant.from(buffer).getPalette();

    const colors = [
      palette.DarkVibrant?.hex,
      palette.Vibrant?.hex,
      palette.DarkMuted?.hex,
    ].filter(Boolean) as string[];

    if (colors.length < 2) {
      return NextResponse.json({ gradient: null });
    }

    return NextResponse.json({
      gradient: `linear-gradient(to right, ${colors.join(", ")})`,
    });
  } catch (err) {
    console.error("[extract-colors] failed:", err);
    return NextResponse.json({ gradient: null });
  }
}