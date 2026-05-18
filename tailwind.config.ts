import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#3d5c34",
          deep: "#2a4023",
          text: "#5b7351",
        },
        sage: {
          DEFAULT: "#7a9a6e",
          light: "#a8c090",
          mid: "#9cb88f",
          pale: "#d3e0c5",
        },
        cream: {
          DEFAULT: "#f1ebda",
          bg: "#f4f7ee",
        },
        ink: "#1c1917",
        stone: {
          DEFAULT: "#57534e",
          light: "#a8a29e",
          200: "#e7e5e4",
        },
        gold: "#c9a961",
        rose: "#b07a7a",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        cormorant: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
