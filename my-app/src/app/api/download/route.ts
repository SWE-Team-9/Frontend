import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/download?url=<encodedUrl>
 *
 * NOTE: This route is only reachable when accessed directly from the Next.js
 * server origin. If the deployment reverse-proxy routes all /api/* requests to
 * the NestJS backend, this route will not be reachable and the offline-cache
 * flow fetches S3 presigned URLs directly instead (CORS is already allowed on
 * the S3 bucket for the app domain).
 *
 * Kept as a fallback inline-streaming proxy for local development.
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