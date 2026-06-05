/** Preset Tailwind compartido — identidad visual EstacionAR (CLAUDE.md §6). */
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        nocturno: "#0A1A2F",
        profundo: "#102A47",
        superficie: "#0E2138",
        borde: "#1C3A5E",
        cyan: {
          DEFAULT: "#0FB6CE",
          50: "#E6FAFD",
          400: "#33C7DA",
          500: "#0FB6CE",
          600: "#0C92A5",
        },
        ambar: {
          DEFAULT: "#F5A623",
          400: "#F7B84E",
          500: "#F5A623",
          600: "#D88A0C",
        },
        texto: "#E8F1F8",
        "texto-tenue": "#9CB3C9",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "'Inter'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(15,182,206,0.25), 0 8px 30px -8px rgba(15,182,206,0.35)",
        card: "0 10px 40px -12px rgba(0,0,0,0.55)",
      },
      backgroundImage: {
        "grid-vial":
          "radial-gradient(circle at 1px 1px, rgba(28,58,94,0.55) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
