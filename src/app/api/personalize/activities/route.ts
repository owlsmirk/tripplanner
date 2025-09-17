import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { destination, travelers, budget } = await req.json();

    const prompt = `
You are a travel assistant. Based on the user's selected destination, traveler profile, and budget,
generate a set of recommended activities. Always return valid JSON.

Format:
{
  "categories": [
    {
      "name": "Category Name (e.g. Culture, Food, Adventure, Nature, Relaxation)",
      "activities": [
        "Specific activity 1",
        "Specific activity 2",
        "Specific activity 3"
      ]
    }
  ]
}

Destination: ${destination}
Travelers: ${JSON.stringify(travelers)}
Budget: ${budget}

Guidelines:
- Include 3–5 categories relevant to this destination.
- Each category should contain 3–6 activities.
- Be specific (e.g., "Guided tour of the Louvre" instead of just "Museum").
- Match the budget (low = affordable/free, high = premium/luxury).
- Consider family vs solo vs couples when suggesting activities.
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful travel activity planner." },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    });

    const rawText = response.choices[0].message?.content || "{}";

    let categories;
    try {
      categories = JSON.parse(rawText).categories;
    } catch (err) {
      console.error("Failed to parse JSON:", rawText);
      categories = [];
    }

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("Error fetching activities:", err);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}
