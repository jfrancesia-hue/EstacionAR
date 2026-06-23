import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "catamarca-preview.jpeg", "catamarca-brand.svg"],
      manifest: {
        name: "EstacionAR · Municipalidad de SFVC",
        short_name: "EstacionAR",
        description: "Estacionamiento medido para la Municipalidad de San Fernando del Valle de Catamarca: pago por patente, efectivo auditado y fiscalización de Tránsito Municipal.",
        lang: "es-AR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#2B0F15",
        theme_color: "#2B0F15",
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,jpeg,woff2}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  server: { port: 5180, strictPort: true },
});
