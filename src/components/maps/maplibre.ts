"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import * as maplibregl from "maplibre-gl";

// Served from public/ (see scripts/copy-maplibre-worker.mjs); the bundled default URL breaks.
maplibregl.setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");

export { maplibregl };

export const NAIROBI: [number, number] = [36.8, -1.28];

/** Basemap style: MapTiler if a key is set, otherwise OpenFreeMap (free, no key, no cookies). */
export function mapStyleUrl(dark: boolean): string {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (key) return `https://api.maptiler.com/maps/dataviz${dark ? "-dark" : ""}/style.json?key=${key}`;
  return `https://tiles.openfreemap.org/styles/${dark ? "dark" : "positron"}`;
}
