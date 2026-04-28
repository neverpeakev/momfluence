import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f3f5fa",
          100: "#e2e7f1",
          200: "#c2cce0",
          300: "#92a2c4",
          400: "#5d70a3",
          500: "#3a4f87",
          600: "#2c3d6c",
          700: "#243155",
          800: "#1c2541",
          900: "#141a30"
        },
        coral: {
          50: "#fff4f1",
          100: "#ffe1d8",
          200: "#ffbaa6",
          300: "#ff8d6f",
          400: "#ff6a48",
          500: "#f04a25",
          600: "#cf3a1b",
          700: "#a82e16",
          800: "#852616",
          900: "#5c1d12"
        }
      },
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Playfair Display", "ui-serif", "serif"]
      }
    }
  },
  plugins: []
};
export default config;
