// Punto de entrada de la API EstacionAR.
import { createApp } from "./app.js";
import { initStore } from "./store.js";
import { env } from "./env.js";

async function main() {
  await initStore();
  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(
      `\n  EstacionAR API ${env.isDemo ? "(modo DEMO)" : ""} escuchando en http://localhost:${env.port}\n` +
        `  Health: http://localhost:${env.port}/api/health\n`,
    );
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("No se pudo iniciar la API:", e);
  process.exit(1);
});
