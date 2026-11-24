"use client";

import { useEffect, useRef } from "react";
import { maplibregl, mapStyleUrl, NAIROBI } from "@/components/maps/maplibre";

/**
 * Staff-only pin picker. Click the map (or drag the pin) to set the exact
 * location. The public site only ever shows an approximate circle.
 */
export default function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const initial = useRef({ lat, lng });

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const { lat: lat0, lng: lng0 } = initial.current;
    const hasPin = lat0 !== null && lng0 !== null;
    const map = new maplibregl.Map({
      container,
      style: mapStyleUrl(false),
      center: hasPin ? [lng0, lat0] : NAIROBI,
      zoom: hasPin ? 15 : 11.5,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const place = (lngLat: maplibregl.LngLatLike) => {
      if (!marker.current) {
        marker.current = new maplibregl.Marker({ color: "#3E7A28", draggable: true }).setLngLat(lngLat).addTo(map);
        marker.current.on("dragend", () => {
          const p = marker.current?.getLngLat();
          if (p) onChangeRef.current(round(p.lat), round(p.lng));
        });
      } else {
        marker.current.setLngLat(lngLat);
      }
    };
    if (hasPin) place([lng0, lat0]);
    map.on("click", (e) => {
      place(e.lngLat);
      onChangeRef.current(round(e.lngLat.lat), round(e.lngLat.lng));
    });
    return () => {
      marker.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (lat !== null && lng !== null) marker.current?.setLngLat([lng, lat]);
  }, [lat, lng]);

  return (
    <div
      ref={ref}
      className="h-80 w-full overflow-hidden rounded-2xl border border-border"
      role="application"
      aria-label="Map: click to place the listing's pin"
    />
  );
}

const round = (n: number) => Math.round(n * 1e6) / 1e6;
