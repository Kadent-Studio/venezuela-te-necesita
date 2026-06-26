"use client";

import { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import "leaflet.markercluster";
import { useMap } from "react-leaflet";
import type { PublicReportDTO } from "@/lib/types";
import { urgencyColor, urgencyLabel } from "@/lib/labels";
import { timeAgo } from "@/lib/time";
import { needTypeLabel } from "@/lib/labels";
import { IconNavigation } from "./ui/icons";
import { NeedChips } from "./ui/badges";

/**
 * Custom cluster icon that shows the count and picks color intensity
 * based on the highest urgency inside the cluster.
 */
function createClusterIcon(
  childCount: number,
  largestUrgency: string,
): L.DivIcon {
  const size = childCount < 10 ? 40 : childCount < 100 ? 48 : 56;
  return L.divIcon({
    className: "vtn-cluster",
    html: `<span class="vtn-cluster-inner" style="
      --cluster-color: ${largestUrgency};
      width:${size}px;height:${size}px;
    ">${childCount}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Returns the CSS variable for the highest urgency among the cluster's children.
 */
function clusterColor(children: L.Marker[]): string {
  let best = 0;
  for (const m of children) {
    const u = (m as unknown as Record<string, number>).vtnUrgency ?? 0;
    if (u > best) best = u;
  }
  const map = [
    "var(--color-bajo)",
    "var(--color-medio)",
    "var(--color-alto)",
    "var(--color-critico)",
  ];
  return map[best] ?? "var(--color-ceniza-3)";
}

/**
 * Urgency rank used for cluster colouring (0 = lowest).
 */
function urgencyRank(urgency: string): number {
  switch (urgency) {
    case "CRITICA":
      return 3;
    case "ALTA":
      return 2;
    case "MEDIA":
      return 1;
    case "BAJA":
      return 0;
    default:
      return 0;
  }
}

function PopupContent({ report }: { report: PublicReportDTO }) {
  return (
    <div className="flex max-w-72 flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span
          className="rounded-input px-2 py-1 text-xs font-bold"
          style={{
            color: urgencyColor[report.urgency],
            background: `color-mix(in srgb, ${urgencyColor[report.urgency]} 12%, var(--superficie))`,
          }}
        >
          {urgencyLabel[report.urgency]}
        </span>
        <span className="font-mono text-[11px] text-ceniza-3">
          {timeAgo(report.createdAt)}
        </span>
      </div>
      <NeedChips needTypes={report.needTypes} />
      <p className="text-sm font-semibold leading-snug text-ceniza">
        {report.address}
      </p>
      <p className="text-xs text-ceniza-3">
        {report.peopleCount}{" "}
        {report.peopleCount === 1 ? "persona afectada" : "personas afectadas"}
      </p>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}&travelmode=driving`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-input)] border px-2.5 py-1.5 text-xs font-semibold text-ceniza-2 transition-colors hover:bg-[color-mix(in_srgb,var(--ceniza)_6%,var(--superficie))] hover:text-ceniza"
        aria-label="Abrir ruta en Google Maps"
      >
        <IconNavigation className="size-3.5" />
        Cómo llegar en Google Maps
      </a>
    </div>
  );
}

export function ReportsMapClusterLayer({
  reports,
  selectedId,
  onSelect,
}: {
  reports: PublicReportDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    // Create the MarkerClusterGroup once
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
          const color = clusterColor(markers);
          return createClusterIcon(cluster.getChildCount(), color);
        },
      });
      map.addLayer(clusterGroupRef.current);
    }

    const clusterGroup = clusterGroupRef.current;
    const prevMarkers = markersRef.current;
    const newMarkers = new Map<string, L.Marker>();

    for (const report of reports) {
      // Re-use existing marker if possible
      const existing = prevMarkers.get(report.id);
      if (existing) {
        newMarkers.set(report.id, existing);
        prevMarkers.delete(report.id);
        continue;
      }

      const icon = L.divIcon({
        className: "",
        html: `<span class="vtn-map-pin${report.id === selectedId ? " is-selected" : ""}" style="--pin-color: ${urgencyColor[report.urgency]}"></span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([report.latitude, report.longitude], { icon });

      // Store extra data for cluster colouring
      (marker as unknown as { vtnUrgency: number }).vtnUrgency = urgencyRank(
        report.urgency,
      );

      marker.bindPopup(renderToStaticMarkup(<PopupContent report={report} />), {
        minWidth: 240,
        className: "",
      });

      marker.on("click", () => onSelect(report.id));
      newMarkers.set(report.id, marker);
    }

    // Remove markers that are no longer in the list
    for (const [, marker] of prevMarkers) {
      clusterGroup.removeLayer(marker);
    }

    // Add new markers
    const toAdd: L.Marker[] = [];
    for (const [, marker] of newMarkers) {
      toAdd.push(marker);
    }
    clusterGroup.addLayers(toAdd);

    markersRef.current = newMarkers;

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
      markersRef.current.clear();
    };
  }, [reports, map, selectedId, onSelect]);

  // Sync selected state without recreating markers
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const el = marker.getElement();
      if (!el) continue;
      const pin = el.querySelector(".vtn-map-pin");
      if (!pin) continue;
      pin.classList.toggle("is-selected", id === selectedId);
    }
  }, [selectedId]);

  return null;
}
