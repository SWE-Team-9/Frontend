import { NextRequest, NextResponse } from "next/server";
import { Vibrant } from "node-vibrant/node";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const imageUrl = req.nextUrl.searchParams.get("imageUrl");
  if (!imageUrl) {
    return NextResponse.json({ gradient: null });
  }

  try {
    const palette = await Vibrant.from(imageUrl).getPalette();

    const colors = [
      palette.DarkVibrant?.hex,
      palette.Vibrant?.hex,
      palette.DarkMuted?.hex,
    ].filter(Boolean) as string[];

    if (colors.length < 2) return NextResponse.json({ gradient: null });

    return NextResponse.json({
      gradient: `linear-gradient(to right, ${colors.join(", ")})`,
    });
  } catch {
    return NextResponse.json({ gradient: null });
  }
}