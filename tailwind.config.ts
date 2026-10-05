import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#050505", 900: "#0a0a0a", 800: "#111111", 700: "#1a1a1a", 600: "#262626", 500: "#3a3a3a" },
        ash: { 400: "#737373", 300: "#a3a3a3", 200: "#d4d4d4", 100: "#ededed" },
        blood: { DEFAULT: "#8b1e2d", soft: "#b4414f" },
        poster: "#e8453c",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        poster: ["var(--font-poster)", "Impact", "sans-serif"],
        church: ["'Bodoni Moda'", "Didot", "Bodoni MT", "Georgia", "serif"],
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
