import { NextRequest, NextResponse } from "next/server";
import { TripDetails, AIResponse } from "@/app/types/trip";

export async function POST(req: NextRequest) {
  try {
    const parsed: TripDetails = await req.json();

    const payload: TripDetails = {
      destination: parsed.destination,
      dateRange: parsed.dateRange,
      travelers: parsed.travelers,
      budget: parsed.budget,
    };

    const aiResult: AIResponse = await generatePlan(payload);
    return NextResponse.json(aiResult);
  } catch (error) {
    console.error("Error in /api/generate:", error);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}

async function generatePlan(payload: TripDetails): Promise<AIResponse> {
  return {
    summary: `Trip to ${payload.destination}`,
    activities: ["Sightseeing", "Local food tour"],
    suggestedActivities: ["Museum visit", "City walk"],
  };
}
