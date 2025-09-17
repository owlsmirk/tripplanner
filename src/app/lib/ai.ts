import { TripDetails, AIResponse } from "@/app/types/trip";

export async function callAIModel(payload: TripDetails): Promise<AIResponse> {
  // Connect to OpenAI, Anthropic, or another LLM here
  return {
    summary: `Generated trip for ${payload.destination}`,
    activities: ["Beach walk", "Local market"],
    suggestedActivities: ["Cooking workshop"],
  };
}
