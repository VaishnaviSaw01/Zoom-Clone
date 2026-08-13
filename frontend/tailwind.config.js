/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zoom: {
          blue: "#0E71EB",
          "blue-dark": "#0B5DC4",
          "blue-light": "#E8F1FD",
          dark: "#1C1C1E",
          "dark-2": "#2C2C2E",
          "dark-3": "#3A3A3C",
          gray: "#636366",
          "light-gray": "#F2F2F7",
          sidebar: "#F7F7F7",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in-left": "slideInLeft 0.25s ease-out",
        "emoji-float": "emojiFloat 3.5s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        emojiFloat: {
          "0%":   { transform: "translateY(0px) scale(0.6)",    opacity: "0" },
          "10%":  { transform: "translateY(-20px) scale(1.1)",  opacity: "1" },
          "70%":  { transform: "translateY(-280px) scale(1.0)", opacity: "0.9" },
          "100%": { transform: "translateY(-480px) scale(0.7)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
