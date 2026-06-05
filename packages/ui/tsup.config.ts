import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "es2020",
  outDir: "dist",
  clean: true,
  dts: true,
  sourcemap: true,
  external: ["react", "react-dom", "react/jsx-runtime"],
  noExternal: ["@estacionar/core"],
});
