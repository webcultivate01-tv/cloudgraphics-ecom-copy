/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        card:        "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-hover":"0 4px 16px -2px rgb(0 0 0 / 0.1), 0 2px 8px -2px rgb(0 0 0 / 0.06)",
        "glow":      "0 0 0 3px rgb(99 102 241 / 0.18)",
        "glow-sm":   "0 0 0 2px rgb(99 102 241 / 0.15)",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        ping2: {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.25s ease-out",
        "ping2":      "ping2 1.5s cubic-bezier(0,0,0.2,1) infinite",
      },
    },
  },
  plugins: [],
}
