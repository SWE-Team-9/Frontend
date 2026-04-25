import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/download?url=<encodedUrl>&filename=<name>
 *
 * Server-side proxy that fetches an external audio file and returns it
 * with Content-Disposition: attachment so the browser downloads it
 * instead of opening the media player.
 *
 * This bypasses CORS restrictions that block direct browser fetches
 * to external CDN URLs.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const filename = searchParams.get("filename") ?? "track.mp3";

  // Validate that a URL was provided
  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }

  // Only allow http/https URLs to prevent SSRF attacks
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    // Fetch the file on the server — no CORS restrictions here
    const upstream = await fetch(parsedUrl.toString(), {
      headers: {
        // Some CDNs require a User-Agent header
        "User-Agent": "Mozilla/5.0 (compatible; SoundCloudClone/1.0)",
      },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream fetch failed: ${upstream.status}` },
        { status: 502 },
      );
    }

    const contentType =
      upstream.headers.get("content-type") ?? "audio/mpeg";

    const arrayBuffer = await upstream.arrayBuffer();

    // Return the file with download headers
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // attachment → forces browser to download instead of play
        "Content-Disposition": `attachment; filename="${filename}.mp3"`,
        "Content-Length": String(arrayBuffer.byteLength),
        // Allow the browser to cache the file for 1 hour
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[Download proxy] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 500 },
    );
  }
}