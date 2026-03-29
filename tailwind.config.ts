import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1536px",
        "xl": "1280px",
        "lg": "1024px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        background: "hsl(var(--bg) / <alpha-value>)",
        foreground: "hsl(var(--text) / <alpha-value>)",
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "#ffffff",
          secondary: "hsl(var(--accent-secondary) / <alpha-value>)",
          tertiary: "hsl(var(--accent-tertiary) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "hsl(var(--surface) / <alpha-value>)",
          hover: "hsl(var(--surface-hover) / <alpha-value>)",
        },
        status: {
          running: "hsl(var(--status-running) / <alpha-value>)",
          stopped: "hsl(var(--status-stopped) / <alpha-value>)",
          fault: "hsl(var(--status-fault) / <alpha-value>)",
          error: "hsl(var(--status-error) / <alpha-value>)",
          warning: "hsl(var(--status-warning) / <alpha-value>)",
        },
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      fontFamily: {
        sans: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      fontSize: {
        "xs": ["0.75rem", { lineHeight: "1rem" }],
        "sm": ["0.875rem", { lineHeight: "1.25rem" }],
        "base": ["1rem", { lineHeight: "1.5rem" }],
        "lg": ["1.125rem", { lineHeight: "1.75rem" }],
        "xl": ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        glow: "var(--shadow-glow)",
      },
      animation: {
        blink: "blink 1s steps(1) infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "spin-slow": "spin-slow 3s linear infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
      keyframes: {
        blink: {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0.3" },
        },
        "pulse-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 12px var(--status-fault-glow), 0 0 20px rgba(239, 68, 68, 0.1)",
          },
          "50%": { 
            boxShadow: "0 0 20px var(--status-fault-glow), 0 0 30px rgba(239, 68, 68, 0.2)",
          },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
