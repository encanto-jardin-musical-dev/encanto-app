import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // pnpm nests transitive deps under .pnpm, so @heroui/theme isn't at the
    // top level of node_modules — use the .pnpm glob so HeroUI's classes are
    // picked up by Tailwind's content scan.
    "./node_modules/.pnpm/**/node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        encanto: {
          extend: "light",
          colors: {
            background: "#FCFEFF",
            foreground: "#1E1F20",
            primary: {
              DEFAULT: "#752E79",
            },
            secondary: {
              DEFAULT: "#00B2FF",
            },
          },
        },
      },
    }),
  ],
} satisfies Config;
