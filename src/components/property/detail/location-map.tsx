"use client";

import { useEffect, useRef } from "react";
import { maplibregl, mapStyleUrl } from "@/components/maps/maplibre";
import { useTheme } from "@/components/providers/theme-provider";
import { APPROXIMATE_RADIUS_M } from "@/lib/geo";

/** Circle polygon (GeoJSON ring) of `radius` metres around a point. */
function circle(lat: number, lng: number, radius: number, steps = 64): [number, number][] {
  const dLat = radius / 111_320;
  const dLng = radius / (111_320 * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return [lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)];
  });
}

/**
 * Detail-page map: a soft circle over the approximate location (already offset
 * server-side), never an exact pin. Loaded only after the visitor asks for it.
 */
export default function LocationMap({
  lat,
  lng,
  label,
  radius = APPROXIMATE_RADIUS_M,
  zoom = 14.2,
}: {
  lat: number;
  lng: number;
  label: string;
  /** Circle radius in metres (default: the listing privacy radius). */
  radius?: number;
  zoom?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const map = new maplibregl.Map({
      container,
      style: mapStyleUrl(resolvedTheme === "dark"),
      center: [lng, lat],
      zoom,
      maxZoom: 16,
      minZoom: 10,
      attributionControl: { compact: true },
      cooperativeGestures: window.matchMedia("(pointer: coarse)").matches,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      map.addSource("area", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [circle(lat, lng, radius)] } },
      });
      map.addLayer({ id: "area-fill", type: "fill", source: "area", paint: { "fill-color": "#E0B458", "fill-opacity": 0.18 } });
      map.addLayer({
        id: "area-line",
        type: "line",
        source: "area",
        paint: { "line-color": "#B0862F", "line-width": 2, "line-dasharray": [2, 1.5] },
      });
    });
    return () => map.remove();
  }, [lat, lng, radius, zoom, resolvedTheme]);

  return <div ref={ref} className="size-full" role="region" aria-label={`Map: ${label}`} data-lenis-prevent />;
}
