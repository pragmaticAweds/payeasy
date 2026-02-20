import type { Config } from "tailwindcss/types";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7D00FF", // Stellar Violet
        secondary: "#000000",
        accent: "#3178C6",
      },
    },
  },
  plugins: [],
};
export default config;
