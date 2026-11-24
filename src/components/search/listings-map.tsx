"use client";

import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { useEffect, useLayoutEffect, useRef } from "react";
import { maplibregl, mapStyleUrl, NAIROBI } from "@/components/maps/maplibre";
import { useCurrency } from "@/components/providers/currency-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { formatCompact, kesToUsd } from "@/lib/format";
import type { MapPoint } from "@/lib/queries/search";

type ListingsMapProps = {
  points: MapPoint[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
};

/**
 * Map of results with price-pill markers and clusters (HTML markers over a
 * clustered GeoJSON source). Pins are offset ~150 m server-side for privacy.
 * Loaded only when the visitor switches to the map view.
 */
export default function ListingsMap({ points, hoveredId, onHover }: ListingsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef(new Map<string, { marker: Marker; el: HTMLElement }>());
  const { resolvedTheme } = useTheme();
  const { currency, usdRate } = useCurrency();
  const onHoverRef = useRef(onHover);
  const pointsRef = useRef(points);

  const priceLabel = (p: MapPoint) => {
    if (p.priceOnRequest || p.priceKes === null) return "POA";
    const base = currency === "KES" ? formatCompact(p.priceKes) : formatCompact(kesToUsd(p.priceKes, usdRate), "USD");
    return base.replace(/^(KES|USD) /, currency === "KES" ? "KES " : "$");
  };
  const priceLabelRef = useRef(priceLabel);

  // Keep the latest props available to the imperative map callbacks.
  useLayoutEffect(() => {
    onHoverRef.current = onHover;
    pointsRef.current = points;
    priceLabelRef.current = priceLabel;
  });

  // Create the map (re-created when the theme flips so the basemap matches).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const markers = markersRef.current;
    const map = new maplibregl.Map({
      container,
      style: mapStyleUrl(resolvedTheme === "dark"),
      center: NAIROBI,
      zoom: 11,
      attributionControl: { compact: true },
      cooperativeGestures: window.matchMedia("(pointer: coarse)").matches,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    const popup = new maplibregl.Popup({ closeButton: true, offset: 18, maxWidth: "260px", className: "sp-popup" });

    function popupContent(p: MapPoint) {
      const root = document.createElement("a");
      root.href = p.href;
      root.className = "block w-56 overflow-hidden rounded-xl bg-surface text-foreground no-underline";
      if (p.image) {
        const img = document.createElement("img");
        img.src = `/_next/image?url=${encodeURIComponent(p.image)}&w=384&q=70`;
        img.alt = "";
        img.className = "h-28 w-full object-cover";
        root.append(img);
      }
      const body = document.createElement("div");
      body.className = "flex flex-col gap-1 p-3";
      const price = document.createElement("p");
      price.className = "font-mono text-sm";
      price.textContent = priceLabelRef.current(p) + (p.pricePeriod === "month" ? "/mo" : p.pricePeriod === "night" ? "/night" : "");
      const title = document.createElement("p");
      title.className = "font-display text-base leading-snug";
      title.textContent = p.title;
      const meta = document.createElement("p");
      meta.className = "text-muted text-xs";
      meta.textContent = [p.areaName, p.bedrooms ? `${p.bedrooms} bed` : null].filter(Boolean).join(" · ");
      body.append(price, title, meta);
      root.append(body);
      return root;
    }

    function sync() {
      if (!map.getSource("listings") || !map.isSourceLoaded("listings")) return;
      const seen = new Set<string>();
      for (const f of map.querySourceFeatures("listings")) {
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        const props = f.properties as Record<string, unknown>;
        const isCluster = Boolean(props.cluster);
        const key = isCluster ? `c${props.cluster_id}` : `p${props.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        let entry = markers.get(key);
        if (!entry) {
          const el = document.createElement("button");
          el.type = "button";
          if (isCluster) {
            const n = Number(props.point_count);
            el.className = "sp-cluster";
            el.textContent = String(n);
            el.setAttribute("aria-label", `${n} homes here — zoom in`);
            el.addEventListener("click", async () => {
              const zoom = await (map.getSource("listings") as GeoJSONSource).getClusterExpansionZoom(Number(props.cluster_id));
              map.easeTo({ center: coords, zoom });
            });
          } else {
            const p = pointsRef.current.find((x) => x.id === props.id);
            if (!p) continue;
            el.className = "sp-pin";
            el.dataset.id = p.id;
            el.textContent = priceLabelRef.current(p);
            el.setAttribute("aria-label", `${p.title}, ${priceLabelRef.current(p)}`);
            el.addEventListener("mouseenter", () => onHoverRef.current(p.id));
            el.addEventListener("mouseleave", () => onHoverRef.current(null));
            el.addEventListener("click", () => {
              popup.setLngLat([p.lng, p.lat]).setDOMContent(popupContent(p)).addTo(map);
            });
          }
          const marker = new maplibregl.Marker({ element: el }).setLngLat(coords).addTo(map);
          entry = { marker, el };
          markers.set(key, entry);
        }
      }
      for (const [key, entry] of markers) {
        if (!seen.has(key)) {
          entry.marker.remove();
          markers.delete(key);
        }
      }
    }

    map.on("load", () => {
      map.addSource("listings", {
        type: "geojson",
        data: toGeoJSON(pointsRef.current),
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 15,
      });
      // An invisible layer keeps the source "in use" so features are queryable.
      map.addLayer({ id: "listings-hit", type: "circle", source: "listings", paint: { "circle-radius": 0, "circle-opacity": 0 } });
      fit(map, pointsRef.current);
    });
    map.on("render", sync);

    return () => {
      for (const { marker } of markers.values()) marker.remove();
      markers.clear();
      popup.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [resolvedTheme]);

  // Update data when results change.
  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("listings") as GeoJSONSource | undefined;
    if (!map || !source) return;
    for (const { marker } of markersRef.current.values()) marker.remove();
    markersRef.current.clear();
    source.setData(toGeoJSON(points));
    fit(map, points);
  }, [points]);

  // Refresh pill labels when the currency changes.
  useEffect(() => {
    for (const { el } of markersRef.current.values()) {
      const p = points.find((x) => x.id === el.dataset.id);
      if (p) el.textContent = priceLabel(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, usdRate]);

  // Highlight the pin of the hovered card.
  useEffect(() => {
    for (const { el } of markersRef.current.values()) {
      el.classList.toggle("is-active", Boolean(hoveredId) && el.dataset.id === hoveredId);
    }
  }, [hoveredId]);

  return (
    <div
      ref={containerRef}
      data-lenis-prevent
      className="sp-map size-full overflow-hidden rounded-(--radius-card) border border-hairline bg-surface-2"
      role="region"
      aria-label="Map of matching homes"
    />
  );
}

function toGeoJSON(points: MapPoint[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { id: p.id },
    })),
  };
}

function fit(map: MapLibreMap, points: MapPoint[]) {
  if (points.length === 0) {
    map.easeTo({ center: NAIROBI, zoom: 11 });
    return;
  }
  if (points.length === 1) {
    map.easeTo({ center: [points[0].lng, points[0].lat], zoom: 14 });
    return;
  }
  const bounds = new maplibregl.LngLatBounds();
  for (const p of points) bounds.extend([p.lng, p.lat]);
  map.fitBounds(bounds, { padding: 70, maxZoom: 14, duration: 600 });
}
