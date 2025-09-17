import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { destination, dateRange, travelers, budget } = await req.json();

    const prompt = `
You are a travel assistant. Return ONLY valid JSON. 
Keys required: weather, crowds, pricing, overall.
You MAY add up to 2 optional keys if relevant (e.g., events, safety, culture, tips).

Example format:
{
  "weather": "Insight on expected climate",
  "crowds": "Insight on crowds",
  "pricing": "Insight on costs",
  "overall": "Holistic summary"
}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful travel assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }, // ✅ forces JSON
    });

    let summary;
    try {
      summary = JSON.parse(response.choices[0].message?.content || "{}");
    } catch (err) {
      console.error("Failed to parse JSON:", response.choices[0].message?.content);
      summary = {
        overall: response.choices[0].message?.content || "No details available.",
      };
    }

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("Error generating plan:", err);
    return NextResponse.json(
      { error: "Failed to generate travel outlook" },
      { status: 500 }
    );
  }
}
