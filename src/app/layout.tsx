import "./globals.css";
import type { Metadata } from "next";
import { Playfair_Display, Lora } from "next/font/google";

// Import fonts
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
});

// Optional: site-wide metadata
export const metadata: Metadata = {
  title: "Trip Planner",
  description: "Personalized travel itineraries powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${playfair.variable}`}
    >
      <body className="font-sans bg-gray-50 text-black">
        {children}
      </body>
    </html>
  );
}
