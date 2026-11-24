"use client";

import { MapTrifoldIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LocationMap = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

/** Static placeholder until the visitor asks for the map (no tile requests before that). */
export function LocationReveal({
  lat,
  lng,
  label,
  radius,
  zoom,
}: {
  lat: number;
  lng: number;
  label: string;
  radius?: number;
  zoom?: number;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative aspect-4/3 overflow-hidden rounded-(--radius-card) border border-hairline bg-ink sm:aspect-video">
      {show ? (
        <LocationMap lat={lat} lng={lng} label={label} radius={radius} zoom={zoom} />
      ) : (
        <button
          type="button"
          onClick={() => setShow(true)}
          className="group grain absolute inset-0 grid place-items-center text-ivory"
        >
          <MapGrid />
          <span className="relative z-10 flex flex-col items-center gap-3">
            <span className="grid size-16 place-items-center rounded-full border border-gold/50 bg-ink/60 text-gold backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
              <MapTrifoldIcon className="size-7" />
            </span>
            <span className="font-medium">Show on map</span>
            <span className="text-ivory/60 text-xs">{label}</span>
          </span>
        </button>
      )}
    </div>
  );
}

/** Decorative street-grid illustration for the placeholder. */
function MapGrid() {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full opacity-40">
      <g fill="none" stroke="#E0B458" strokeOpacity="0.25" strokeWidth="1">
        <path d="M-10 60 C 80 40, 160 90, 410 50" />
        <path d="M-10 170 C 120 150, 220 210, 410 160" />
        <path d="M-10 250 C 100 240, 260 280, 410 240" />
        <path d="M70 -10 C 90 90, 50 200, 90 310" />
        <path d="M210 -10 C 190 110, 240 190, 200 310" />
        <path d="M330 -10 C 350 100, 300 220, 340 310" />
      </g>
      <circle cx="200" cy="150" r="46" fill="#E0B458" fillOpacity="0.12" stroke="#E0B458" strokeOpacity="0.6" strokeDasharray="5 4" />
    </svg>
  );
}
