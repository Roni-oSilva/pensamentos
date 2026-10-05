import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "rgb(var(--ink-950) / <alpha-value>)", 900: "rgb(var(--ink-900) / <alpha-value>)", 800: "rgb(var(--ink-800) / <alpha-value>)", 700: "rgb(var(--ink-700) / <alpha-value>)", 600: "rgb(var(--ink-600) / <alpha-value>)", 500: "rgb(var(--ink-500) / <alpha-value>)" },
        ash: { 400: "rgb(var(--ash-400) / <alpha-value>)", 300: "rgb(var(--ash-300) / <alpha-value>)", 200: "rgb(var(--ash-200) / <alpha-value>)", 100: "rgb(var(--ash-100) / <alpha-value>)" },
        white: "rgb(var(--c-white) / <alpha-value>)",
        verse: "rgb(var(--verse) / <alpha-value>)",
        prayer: "rgb(var(--prayer) / <alpha-value>)",
        blood: { DEFAULT: "#8b1e2d", soft: "#b4414f" },
        poster: "#e8453c",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        poster: ["var(--font-poster)", "Impact", "sans-serif"],
        church: ["var(--font-poster)", "Didot", "Georgia", "serif"],
      },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
        flicker: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".82" } },
      },
      animation: { rise: "rise .5s ease-out both", flicker: "flicker 6s ease-in-out infinite" },
    },
  },
  plugins: [typography],
};
export default config;
