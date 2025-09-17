import { NextRequest } from "next/server";
import { TripDetails } from "@/app/types/trip";

interface StayResponse {
  hotelName: string;
  location: string;
  price: string;
}

export async function POST(req: NextRequest) {
  const parsed: TripDetails = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      const stays: StayResponse[] = [
        { hotelName: "Eco Lodge", location: parsed.destination, price: "$150/night" },
        { hotelName: "City Hotel", location: parsed.destination, price: "$220/night" },
      ];

      for (const stay of stays) {
        controller.enqueue(JSON.stringify(stay));
        await new Promise((r) => setTimeout(r, 500));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/json" },
  });
}
