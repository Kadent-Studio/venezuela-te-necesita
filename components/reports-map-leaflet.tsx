"use client";

import { useEffect } from "react";
import L, { type LatLngExpression } from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { PublicReportDTO } from "@/lib/types";
import { ReportsMapClusterLayer } from "@/components/reports-map-cluster";

const MAIQUETIA_CENTER: LatLngExpression = [10.5967, -66.9562];
const VENEZUELA_BOUNDS: L.LatLngBoundsExpression = [
  [0.6, -73.4],
  [12.3, -59.8],
];

function FocusSelected({
  report,
  reduceMotion,
}: {
  report: PublicReportDTO | null;
  reduceMotion: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!report) return;
    const target: LatLngExpression = [report.latitude, report.longitude];
    if (reduceMotion) {
      map.setView(target, Math.max(map.getZoom(), 14));
      return;
    }
    map.flyTo(target, Math.max(map.getZoom(), 14), {
      duration: 0.55,
      easeLinearity: 0.25,
    });
  }, [map, reduceMotion, report]);

  return null;
}

function FitReports({ reports }: { reports: PublicReportDTO[] }) {
  const map = useMap();

  useEffect(() => {
    if (reports.length === 0) return;
    const bounds = L.latLngBounds(reports.map((r) => [r.latitude, r.longitude]));
    map.fitBounds(bounds.pad(0.18), { maxZoom: 13, animate: false });
  }, [map, reports]);

  return null;
}

export function ReportsMapLeaflet({
  reports,
  selectedId,
  reduceMotion,
  onSelect,
}: {
  reports: PublicReportDTO[];
  selectedId: string | null;
  reduceMotion: boolean;
  onSelect: (id: string) => void;
}) {
  const selectedReport = reports.find((r) => r.id === selectedId) ?? null;

  return (
    <MapContainer
      center={MAIQUETIA_CENTER}
      zoom={12}
      minZoom={5}
      maxBounds={VENEZUELA_BOUNDS}
      maxBoundsViscosity={0.75}
      scrollWheelZoom
      className="relative z-0 h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reports.length > 0 && <FitReports reports={reports} />}
      <FocusSelected report={selectedReport} reduceMotion={reduceMotion} />
      <ReportsMapClusterLayer
        reports={reports}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </MapContainer>
  );
}
