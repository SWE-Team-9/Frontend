import { trackStatusStore } from "@/src/store/trackStatusStore";

export async function POST(req: Request) {
  try {
    const data = await req.json(); // now this will succeed

    if (!data.fileName) {
      return new Response(JSON.stringify({ error: "Missing fileName" }), { status: 400 });
    }

    // For mock purposes, mark it as processing
    trackStatusStore[data.fileName] = "PROCESSING";

    // Return a mock trackId (you can use fileName itself for simplicity)
    return new Response(
      JSON.stringify({ status: "PROCESSING", trackId: data.fileName }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }
}