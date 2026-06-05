import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "municipalidad-salta.jpeg"],
      manifest: {
        name: "EstacionAR · Municipalidad de Salta",
        short_name: "EstacionAR",
        description: "Estacionamiento medido para la Municipalidad de Salta: pago por patente, efectivo auditado y control fiscal municipal.",
        lang: "es-AR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0A1A2F",
        theme_color: "#0A1A2F",
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,jpeg,woff2}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: { port: 5180, strictPort: true },
});
