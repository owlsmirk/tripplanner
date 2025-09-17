import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { destination, travelers, budget } = body;

    const prompt = `
    Suggest 5–7 popular activities for ${destination || "this destination"}.
    Context:
    - Travelers: ${JSON.stringify(travelers)}
    - Budget: ${budget || "any"}
    
    Respond in strict JSON:
    {
      "suggestedActivities": ["activity1", "activity2", ...]
    }
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    let parsed;
    try {
      parsed = JSON.parse(completion.choices[0].message?.content || "{}");
    } catch {
      parsed = {};
    }

    return NextResponse.json({
      suggestedActivities:
        parsed.suggestedActivities || [
          "City walking tour",
          "Local food tasting",
          "Popular museum visit",
          "Outdoor adventure",
          "Relax at a scenic spot",
        ],
    });
  } catch (error) {
    console.error("Error generating activities:", error);
    return NextResponse.json(
      {
        suggestedActivities: [
          "City walking tour",
          "Local food tasting",
          "Popular museum visit",
          "Outdoor adventure",
          "Relax at a scenic spot",
        ],
      },
      { status: 500 }
    );
  }
}
