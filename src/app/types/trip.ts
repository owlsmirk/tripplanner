// src/app/types/trip.ts
export interface TripDetails {
  destination: string;
  dateRange:
    | { startDate: string; endDate: string }
    | { days: number; month: string };
  travelers: {
    adults: number;
    children: number;
    infants: number;
    pets: number;
  };
  budget: "low" | "mid" | "high" | "luxury" | "";
  selectedActivities?: string[];
}

export interface AIResponse {
  summary?: string;
  activities?: string[];
  suggestedActivities?: string[];
}
