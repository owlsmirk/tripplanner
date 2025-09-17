import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { destination, dateRange, travelers, budget } = body;

    const prompt = `
    Provide a concise overview for ${destination || "this trip"}.

    Context:
    - Travel dates: ${JSON.stringify(dateRange)}
    - Travelers: ${JSON.stringify(travelers)}
    - Budget: ${budget || "any"}

    Respond in JSON:
    {
      "summary": "1–2 paragraphs with weather, crowds, pricing and what to expect for this specific timeframe."
    }
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0].message?.content || "{}");

    return NextResponse.json({
      summary: parsed.summary || "Overview not available.",
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json({ summary: "Unable to generate overview." }, { status: 500 });
  }
}
