import { NextRequest } from "next/server";
import { TripDetails, AIResponse } from "@/app/types/trip";

export async function POST(req: NextRequest) {
  const parsed: TripDetails = await req.json();

  // Stream responses from your AI model
  const stream = new ReadableStream({
    async start(controller) {
      const chunks: AIResponse[] = [
        { summary: `Day 1: Explore ${parsed.destination}` },
        { activities: ["Morning walk", "Local breakfast"] },
        { suggestedActivities: ["Evening cruise"] },
      ];

      for (const chunk of chunks) {
        controller.enqueue(JSON.stringify(chunk));
        await new Promise((r) => setTimeout(r, 500));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/json" },
  });
}
