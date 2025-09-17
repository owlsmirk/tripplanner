import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-lora)", "serif"],       // 👈 Lora as global body font
        playfair: ["var(--font-playfair)", "serif"], // 👈 Playfair for headings
      },
    },
  },
};

export default config;
