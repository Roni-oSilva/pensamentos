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
        // tokens do shadcn/ui, ligados à paleta do site (funcionam nos temas claro e escuro)
        background: "rgb(var(--ink-950) / <alpha-value>)",
        foreground: "rgb(var(--ash-100) / <alpha-value>)",
        card: { DEFAULT: "rgb(var(--ink-900) / <alpha-value>)", foreground: "rgb(var(--ash-100) / <alpha-value>)" },
        primary: { DEFAULT: "rgb(var(--ash-100) / <alpha-value>)", foreground: "rgb(var(--ink-950) / <alpha-value>)" },
        secondary: { DEFAULT: "rgb(var(--ink-800) / <alpha-value>)", foreground: "rgb(var(--ash-100) / <alpha-value>)" },
        muted: { DEFAULT: "rgb(var(--ink-800) / <alpha-value>)", foreground: "rgb(var(--ash-400) / <alpha-value>)" },
        accent: { DEFAULT: "rgb(var(--ink-800) / <alpha-value>)", foreground: "rgb(var(--ash-100) / <alpha-value>)" },
        destructive: { DEFAULT: "#b4414f", foreground: "#ffffff" },
        border: "rgb(var(--ink-700) / <alpha-value>)",
        input: "rgb(var(--ink-600) / <alpha-value>)",
        ring: "rgb(var(--ash-300) / <alpha-value>)",
      },
      borderRadius: { lg: "0.75rem", md: "calc(0.75rem - 2px)", sm: "calc(0.75rem - 4px)" },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        poster: ["var(--font-poster)", "Impact", "sans-serif"],
        church: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
        bell: { "0%,100%": { transform: "rotate(0)" }, "15%": { transform: "rotate(14deg)" }, "30%": { transform: "rotate(-12deg)" }, "45%": { transform: "rotate(8deg)" }, "60%": { transform: "rotate(-5deg)" }, "75%": { transform: "rotate(2deg)" } },
        flicker: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".82" } },
      },
      animation: { rise: "rise .5s ease-out both", flicker: "flicker 6s ease-in-out infinite", bell: "bell 1.2s ease-in-out 1" },
    },
  },
  plugins: [typography],
};
export default config;
