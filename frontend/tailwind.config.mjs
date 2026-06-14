/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Geist'", "'DM Sans'", "sans-serif"],
        mono: ["'Geist Mono'", "'JetBrains Mono'", "monospace"],
        display: ["'Cabinet Grotesk'", "'Syne'", "sans-serif"],
      },
      colors: {
        void: "#070B12",
        "void-2": "#0D1321",
        "void-3": "#131A2B",
        "surface": "#1A2236",
        "surface-2": "#1F2A3C",
        "border": "#263147",
        "border-2": "#2E3B54",
        "muted": "#4D6080",
        "muted-2": "#667A99",
        "text": "#C8D6EF",
        "text-2": "#8FA3C0",
        "accent": "#3B82F6",
        "accent-2": "#60A5FA",
        "accent-glow": "rgba(59,130,246,0.15)",
        "emerald-glow": "rgba(16,185,129,0.15)",
        "amber-glow": "rgba(245,158,11,0.15)",
        "rose-glow": "rgba(244,63,94,0.15)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(38,49,71,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(38,49,71,0.6) 1px, transparent 1px)",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
      boxShadow: {
        "glow-accent": "0 0 24px rgba(59,130,246,0.25)",
        "glow-emerald": "0 0 24px rgba(16,185,129,0.25)",
        "glow-amber": "0 0 24px rgba(245,158,11,0.2)",
        "glow-rose": "0 0 24px rgba(244,63,94,0.25)",
        "card": "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        "card-lg": "0 4px 16px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
