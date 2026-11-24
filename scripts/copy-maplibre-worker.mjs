// Copies MapLibre's web worker into public/ so it can be served at a stable URL.
// MapLibre 6 resolves its worker relative to its own module, which breaks once
// bundled; the map calls setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs").
// Runs on postinstall / predev / prebuild so the worker always matches the installed version.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve("maplibre-gl/package.json"));
const outDir = join(process.cwd(), "public", "vendor", "maplibre");
mkdirSync(outDir, { recursive: true });
copyFileSync(join(pkgDir, "dist", "maplibre-gl-worker.mjs"), join(outDir, "maplibre-gl-worker.mjs"));
console.log("[maplibre] worker copied to public/vendor/maplibre/");
