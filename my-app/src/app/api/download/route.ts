import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/download?url=<encodedUrl>
 *
 * Server-side proxy that fetches an external audio file (e.g. a short-lived
 * S3 presigned URL) and returns it as an inline audio stream.
 *
 * This is used by the client-side offline cache: the browser fetches the
 * audio through this proxy (avoiding S3 CORS issues), stores the resulting
 * Blob in IndexedDB, and plays it back when offline. No file is saved to
 * the device file system.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
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
    const upstream = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IQA3/1.0)",
      },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream fetch failed: ${upstream.status}` },
        { status: 502 },
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "audio/mpeg";
    const arrayBuffer = await upstream.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // inline → browser treats it as audio, not a file download
        "Content-Disposition": "inline",
        "Content-Length": String(arrayBuffer.byteLength),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[Audio proxy] Error:", err);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}