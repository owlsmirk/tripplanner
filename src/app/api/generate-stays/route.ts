import { NextRequest, NextResponse } from "next/server";
import { TripDetails } from "@/app/types/trip";

interface StayResponse {
  hotelName: string;
  location: string;
  price: string;
}

export async function POST(req: NextRequest) {
  try {
    const parsed: TripDetails = await req.json();

    const stays: StayResponse[] = [
      { hotelName: "Seaside Resort", location: parsed.destination, price: "$200/night" },
      { hotelName: "Luxury Inn", location: parsed.destination, price: "$350/night" },
    ];

    return NextResponse.json(stays);
  } catch (error) {
    console.error("Error in /api/generate-stays:", error);
    return NextResponse.json({ error: "Failed to generate stays" }, { status: 500 });
  }
}
