"use client";

import { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import "leaflet.markercluster";
import { useMap } from "react-leaflet";
import type { PublicCentroDTO } from "@/lib/types";
import {
  stockLevelColor,
  stockLevelLabel,
  stockLevelRank,
  supplyTypeLabel,
} from "@/lib/labels";
import { centroTopLevel } from "@/lib/centros";
import { timeAgo } from "@/lib/time";
import { IconNavigation } from "./ui/icons";

const RANK_COLOR = [
  "var(--color-ceniza-3)", // SOBRADO
  "var(--color-bajo)", // SUFICIENTE
  "var(--color-alto)", // NECESITA
  "var(--color-critico)", // URGENTE
];

function createClusterIcon(childCount: number, color: string): L.DivIcon {
  const size = childCount < 10 ? 40 : childCount < 100 ? 48 : 56;
  return L.divIcon({
    className: "vtn-cluster",
    html: `<span class="vtn-cluster-inner" style="
      --cluster-color: ${color};
      width:${size}px;height:${size}px;
    ">${childCount}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function clusterColor(children: L.Marker[]): string {
  let best = 0;
  for (const m of children) {
    const r = (m as unknown as Record<string, number>).vtnLevel ?? 0;
    if (r > best) best = r;
  }
  return RANK_COLOR[best] ?? "var(--color-ceniza-3)";
}

function PopupContent({ centro }: { centro: PublicCentroDTO }) {
  const top = centroTopLevel(centro.items);
  const color = stockLevelColor[top];
  const urgent = centro.items.filter((i) => i.level === "URGENTE");

  return (
    <div className="flex max-w-72 flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span
          className="rounded-input px-2 py-1 text-xs font-bold"
          style={{
            color,
            background: `color-mix(in srgb, ${color} 12%, var(--superficie))`,
          }}
        >
          {stockLevelLabel[top]}
        </span>
        <span className="font-mono text-[11px] text-ceniza-3">
          {timeAgo(centro.lastStockUpdatedAt)}
        </span>
      </div>
      <p className="text-sm font-semibold leading-snug text-ceniza">
        {centro.name}
      </p>
      {urgent.length > 0 ? (
        <p className="text-xs text-ceniza-2">
          Urgente:{" "}
          {urgent.map((i) => supplyTypeLabel[i.supplyType]).join(", ")}
        </p>
      ) : (
        <p className="text-xs text-ceniza-3">{centro.address}</p>
      )}
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${centro.latitude},${centro.longitude}&travelmode=driving`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-input)] border px-2.5 py-1.5 text-xs font-semibold text-ceniza-2 transition-colors hover:bg-[color-mix(in_srgb,var(--ceniza)_6%,var(--superficie))] hover:text-ceniza"
        aria-label="Abrir ruta en Google Maps"
      >
        <IconNavigation className="size-3.5" />
        Cómo llegar
      </a>
    </div>
  );
}

function createCentroMarker(
  centro: PublicCentroDTO,
  selectedId: string | null,
  onSelect: (id: string) => void,
): L.Marker {
  const top = centroTopLevel(centro.items);
  const color = stockLevelColor[top];

  const icon = L.divIcon({
    className: "",
    html: renderToStaticMarkup(
      <span
        className="vtn-centro-pin relative flex size-6 items-center justify-center rounded-[6px] border-[2.5px] border-(--superficie) bg-(--pin-color) shadow-[0_1px_2px_rgba(31,27,23,0.2),0_6px_14px_rgba(31,27,23,0.28)] transition-[transform,box-shadow] duration-160 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none data-selected:scale-[1.22] data-selected:shadow-[0_0_0_5px_color-mix(in_srgb,var(--pin-color)_18%,transparent),0_8px_20px_rgba(31,27,23,0.32)]"
        style={{ "--pin-color": color } as React.CSSProperties}
        data-selected={centro.id === selectedId ? true : undefined}
      >
        <span className="block h-2 w-2.5 rounded-[1px] border-[1.5px] border-(--superficie)" />
      </span>,
    ),
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });

  const marker = L.marker([centro.latitude, centro.longitude], { icon });
  (marker as unknown as { vtnLevel: number }).vtnLevel = stockLevelRank[top];

  marker.bindPopup(renderToStaticMarkup(<PopupContent centro={centro} />), {
    minWidth: 240,
    className: "",
  });

  marker.on("click", () => onSelect(centro.id));
  return marker;
}

export function CentrosMapClusterLayer({
  centros,
  selectedId,
  onSelect,
}: {
  centros: PublicCentroDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!clusterGroupRef.current) {
      clusterGroupRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 55,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 16,
        iconCreateFunction: (cluster) => {
          const markers = cluster.getAllChildMarkers();
          return createClusterIcon(cluster.getChildCount(), clusterColor(markers));
        },
      });
      map.addLayer(clusterGroupRef.current);
    }

    const clusterGroup = clusterGroupRef.current;
    const prevMarkers = markersRef.current;
    const newMarkers = new Map<string, L.Marker>();

    for (const centro of centros) {
      const existing = prevMarkers.get(centro.id);
      if (existing) {
        newMarkers.set(centro.id, existing);
        prevMarkers.delete(centro.id);
        continue;
      }
      newMarkers.set(centro.id, createCentroMarker(centro, selectedId, onSelect));
    }

    for (const [, marker] of prevMarkers) clusterGroup.removeLayer(marker);

    const toAdd: L.Marker[] = [];
    for (const [, marker] of newMarkers) toAdd.push(marker);
    clusterGroup.addLayers(toAdd);

    markersRef.current = newMarkers;

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
      markersRef.current.clear();
    };
  }, [centros, map, selectedId, onSelect]);

  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const el = marker.getElement();
      if (!el) continue;
      const pin = el.querySelector<HTMLElement>(".vtn-centro-pin");
      if (!pin) continue;
      pin.toggleAttribute("data-selected", id === selectedId);
    }
  }, [selectedId]);

  return null;
}
