"use client";

import { useState, useEffect, useMemo } from "react";
import L from "leaflet";
import { Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import Supercluster from "supercluster";
import type { PublicReportDTO } from "@/lib/types";
import { urgencyColor, urgencyLabel } from "@/lib/labels";
import { timeAgo } from "@/lib/time";
import { IconNavigation } from "./ui/icons";
import { NeedChips } from "./ui/badges";

// ── Tipos para propiedades de features de Supercluster ──

interface MarkerProps {
  reportId: string;
  urgency: string;
  urgencyRank: number;
  report: PublicReportDTO;
}

interface ClusterProps {
  maxUrgencyRank: number;
}

// ── Helpers ──

function urgencyRank(urgency: string): number {
  const map: Record<string, number> = {
    CRITICA: 3,
    ALTA: 2,
    MEDIA: 1,
    BAJA: 0,
  };
  return map[urgency] ?? 0;
}

const URGENCY_CSS_MAP = [
  "var(--color-bajo)",
  "var(--color-medio)",
  "var(--color-alto)",
  "var(--color-critico)",
];

function createClusterIcon(count: number, maxRank: number): L.DivIcon {
  const size = count < 10 ? 40 : count < 100 ? 48 : 56;
  const color = URGENCY_CSS_MAP[maxRank] ?? "var(--color-ceniza-3)";
  return L.divIcon({
    className: "vtn-cluster",
    html: `<span class="vtn-cluster-inner" style="--cluster-color: ${color}; width:${size}px; height:${size}px;">${count}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createReportIcon(urgency: string, isSelected: boolean): L.DivIcon {
  const color = urgencyColor[urgency as keyof typeof urgencyColor];
  const selectedAttr = isSelected ? ' data-selected="true"' : "";
  return L.divIcon({
    className: "",
    html: `<span class="vtn-map-pin" style="--vtn-pin-color: ${color};"${selectedAttr}><span class="vtn-map-pin-dot"></span></span>`,
    iconSize: [32, 36],
    iconAnchor: [16, 36],
    popupAnchor: [0, -28],
  });
}

// ── Componente principal ──

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
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(
    null,
  );
  const [zoom, setZoom] = useState(map.getZoom());

  // Escuchar eventos del mapa para mantener bounds y zoom actualizados
  useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
      setZoom(map.getZoom());
    },
  });

  // Inicializar bounds al montar
  useEffect(() => {
    const b = map.getBounds();
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    setZoom(map.getZoom());
  }, [map]);

  const points = reports.map((report) => ({
    type: "Feature" as const,
    properties: {
      reportId: report.id,
      urgency: report.urgency,
      urgencyRank: urgencyRank(report.urgency),
      report,
    },
    geometry: {
      type: "Point" as const,
      coordinates: [report.longitude, report.latitude],
    },
  }));

  // Índice Supercluster memoizado
  const index = useMemo(() => {
    return new Supercluster<MarkerProps, ClusterProps>({
      radius: 55,
      maxZoom: 15,
      map: (props) => ({ maxUrgencyRank: props.urgencyRank }),
      reduce: (acc, props) => {
        acc.maxUrgencyRank = Math.max(acc.maxUrgencyRank, props.maxUrgencyRank);
      },
    }).load(points);
  }, [points]);

  // Calcular clusters y marcadores visibles según viewport actual
  const clustersAndMarkers = bounds
    ? index.getClusters(
        [bounds[0], bounds[1], bounds[2], bounds[3]],
        Math.floor(zoom),
      )
    : [];

  return (
    <>
      {clustersAndMarkers.map((feature) => {
        const [longitude, latitude] = feature.geometry.coordinates;
        const props = feature.properties;

        // ── Cluster ──
        if ("cluster" in props && props.cluster) {
          return (
            <Marker
              key={`cluster-${feature.id}`}
              position={[latitude, longitude]}
              icon={createClusterIcon(
                props.point_count,
                props.maxUrgencyRank ?? 0,
              )}
              eventHandlers={{
                click: () => {
                  const expansionZoom = Math.min(
                    index.getClusterExpansionZoom(feature.id as number),
                    18,
                  );
                  map.setView([latitude, longitude], expansionZoom);
                },
              }}
            />
          );
        }

        // ── Marcador individual ──
        const { reportId, report } = props as MarkerProps;
        const isSelected = reportId === selectedId;
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}&travelmode=driving`;

        return (
          <Marker
            key={`report-${reportId}`}
            position={[latitude, longitude]}
            icon={createReportIcon(report.urgency, isSelected)}
            eventHandlers={{
              click: () => onSelect(reportId),
            }}
          >
            <Popup minWidth={240}>
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
                  {report.peopleCount === 1
                    ? "persona afectada"
                    : "personas afectadas"}
                </p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-input)] border px-2.5 py-1.5 text-xs font-semibold text-ceniza-2 transition-colors hover:bg-[color-mix(in_srgb,var(--ceniza)_6%,var(--superficie))] hover:text-ceniza"
                  aria-label="Abrir ruta en Google Maps"
                >
                  <IconNavigation className="size-3.5" />
                  Cómo llegar en Google Maps
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
