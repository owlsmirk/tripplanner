import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { destination, dateRange, travelers, budget, selectedActivities } = body;

    // Build the refine prompt
    const prompt = `
    Refine the travel itinerary for ${destination || "the trip"}.

    Dates: ${dateRange?.startDate || "flexible"} to ${dateRange?.endDate || "flexible"}.
    Travelers: ${JSON.stringify(travelers)}.
    Budget: ${budget || "any"}.
    Focus especially on these selected activities: ${selectedActivities?.join(", ") || "none"}.

    Please respond in strict JSON with:
    {
      "summary": "short summary paragraph",
      "activities": ["list of refined activities"],
      "suggestedActivities": ["extra ideas to consider"]
    }
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0].message?.content || "{}");

    return NextResponse.json({
      summary: parsed.summary || "Refined itinerary unavailable.",
      activities: parsed.activities || [],
      suggestedActivities: parsed.suggestedActivities || [],
    });
  } catch (error) {
    console.error("Error refining itinerary:", error);
    return NextResponse.json(
      { summary: "Could not refine itinerary.", activities: [], suggestedActivities: [] },
      { status: 500 }
    );
  }
}
