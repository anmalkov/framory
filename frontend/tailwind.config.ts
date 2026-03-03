import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        framory: {
          bg: "var(--color-bg)",
          surface: "var(--color-surface)",
          primary: "var(--color-primary)",
          text: "var(--color-text)",
          muted: "var(--color-muted)",
          error: "var(--color-error)",
          success: "var(--color-success)",
          warning: "var(--color-warning)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
