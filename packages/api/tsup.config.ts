import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // core se resuelve por workspace; el resto queda como external (node_modules)
  noExternal: ["@estacionar/core"],
});
