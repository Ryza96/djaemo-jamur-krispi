import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "primary-light": "var(--primary-light)",
        secondary: "var(--secondary)",
        "secondary-light": "var(--secondary-light)",
        accent: "var(--accent)",
        surface: "var(--surface)",
        "surface-dark": "var(--surface-dark)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        background: "var(--background)",
      },
      fontFamily: {
        sans: "var(--font-geist-sans)",
        mono: "var(--font-geist-mono)",
      },
      boxShadow: {
        soft: "0 18px 60px -24px rgba(15, 23, 42, 0.12)",
        card: "0 24px 90px -50px rgba(107, 66, 38, 0.18)",
        glow: "0 0 0 1px rgba(255, 255, 255, 0.08), 0 20px 60px -30px rgba(15, 23, 42, 0.16)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      maxWidth: {
        "7xl": "80rem",
      },
      spacing: {
        112: "28rem",
        128: "32rem",
        144: "36rem",
      },
    },
  },
  plugins: [],
};

export default config;
