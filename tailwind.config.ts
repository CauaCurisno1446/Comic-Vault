import type { Config } from "tailwindcss"

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cv: {
          bg: "var(--cv-bg)",
          "bg-2": "var(--cv-bg-secondary)",
          sidebar: "var(--cv-sidebar)",
          "sidebar-hover": "var(--cv-sidebar-hover)",
          card: "var(--cv-card)",
          "card-hover": "var(--cv-card-hover)",
          border: "var(--cv-border)",
          accent: "var(--cv-accent)",
          "accent-h": "var(--cv-accent-hover)",
          "accent-m": "var(--cv-accent-muted)",
          text: "var(--cv-text)",
          muted: "var(--cv-text-muted)",
          subtle: "var(--cv-text-subtle)",
        },
      },
      borderRadius: {
        cv: "var(--cv-radius-card)",
        "cv-btn": "var(--cv-radius-btn)",
      },
    },
  },
  plugins: [],
} satisfies Config
