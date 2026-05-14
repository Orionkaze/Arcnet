import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arc: {
          page: "#080c14",
          card: "#0d1320",
          accent: "#00b4e6",
          input: "#080c14",
          "google-bg": "#0a0f1c",
          primary: "#e4f0ff",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        chakra: ["var(--font-chakra-petch)", "sans-serif"],
      },
      borderColor: {
        arc: {
          card: "rgba(0,180,230,0.22)",
          input: "rgba(0,180,230,0.18)",
          "input-focus": "#00b4e6",
          google: "rgba(255,255,255,0.1)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
