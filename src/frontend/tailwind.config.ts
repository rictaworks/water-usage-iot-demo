import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        deep: '#040810',
        sidebar: '#070e1c',
        card: '#0a1628',
        accent: '#00c8ff',
        warning: 'rgba(255,200,80,0.9)',
        error: 'rgba(255,80,80,0.9)',
      },
    },
  },
  plugins: [],
};
export default config;
