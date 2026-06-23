/** Preset Tailwind compartido — identidad visual EstacionAR SFVC. */
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        nocturno: "#F4F8FC",
        profundo: "#E8F1F8",
        superficie: "#FFFFFF",
        borde: "#D5E3EF",
        cyan: {
          DEFAULT: "#00A6D6",
          50: "#E8F8FD",
          400: "#28BDE5",
          500: "#00A6D6",
          600: "#007FAA",
        },
        ambar: {
          DEFAULT: "#F28C00",
          400: "#FFA629",
          500: "#F28C00",
          600: "#C46F00",
        },
        texto: "#163A63",
        "texto-tenue": "#526B83",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "'Inter'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0,166,214,0.24), 0 10px 32px -12px rgba(0,93,150,0.30)",
        card: "0 16px 45px -24px rgba(22,58,99,0.28)",
      },
      backgroundImage: {
        "grid-vial":
          "radial-gradient(circle at 1px 1px, rgba(0,166,214,0.16) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
