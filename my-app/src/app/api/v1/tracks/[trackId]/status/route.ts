// app/api/v1/tracks/[trackId]/status/route.ts
import { trackStatusStore } from "@/src/store/trackStatusStore";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const { trackId } = await params;

  const status = trackStatusStore[trackId] || "PROCESSING";

  // For testing, we can automatically mark it as DONE after first poll
  if (status === "PROCESSING") {
    trackStatusStore[trackId] = "DONE";
  }

  return new Response(JSON.stringify({ status }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}