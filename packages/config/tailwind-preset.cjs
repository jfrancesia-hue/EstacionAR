/** Preset Tailwind compartido — identidad visual EstacionAR Catamarca. */
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        nocturno: "#2B0F15",
        profundo: "#3A161E",
        superficie: "#241015",
        borde: "#6F2A28",
        cyan: {
          DEFAULT: "#C1272D",
          50: "#FFF1F2",
          400: "#E45C58",
          500: "#C1272D",
          600: "#9F1D25",
        },
        ambar: {
          DEFAULT: "#E0A82E",
          400: "#E9BF57",
          500: "#E0A82E",
          600: "#B98216",
        },
        texto: "#FFF4EA",
        "texto-tenue": "#D8B8A3",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "'Inter'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(193,39,45,0.25), 0 8px 30px -8px rgba(193,39,45,0.38)",
        card: "0 10px 40px -12px rgba(22,4,8,0.70)",
      },
      backgroundImage: {
        "grid-vial":
          "radial-gradient(circle at 1px 1px, rgba(224,168,46,0.28) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
