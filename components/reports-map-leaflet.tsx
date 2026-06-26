"use client";

import { useEffect, useMemo, useRef } from "react";
import L, { type LatLngExpression } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { PublicReportDTO } from "@/lib/types";
import { urgencyColor, urgencyLabel } from "@/lib/labels";
import { timeAgo } from "@/lib/time";
import { NeedChips } from "@/components/ui/badges";

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

function ReportMarker({
  report,
  selected,
  onSelect,
}: {
  report: PublicReportDTO;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<span class="vtn-map-pin${selected ? " is-selected" : ""}" style="--pin-color: ${urgencyColor[report.urgency]}"></span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -14],
      }),
    [report.urgency, selected],
  );

  useEffect(() => {
    if (selected) markerRef.current?.openPopup();
  }, [selected]);

  return (
    <Marker
      ref={markerRef}
      icon={icon}
      position={[report.latitude, report.longitude]}
      eventHandlers={{
        click: () => onSelect(report.id),
      }}
    >
      <Popup minWidth={240}>
        <div className="flex max-w-72 flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span
              className="rounded-[var(--radius-input)] px-2 py-1 text-xs font-bold"
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
        </div>
      </Popup>
    </Marker>
  );
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
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reports.length > 0 && <FitReports reports={reports} />}
      <FocusSelected report={selectedReport} reduceMotion={reduceMotion} />
      {reports.map((report) => (
        <ReportMarker
          key={report.id}
          report={report}
          selected={report.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </MapContainer>
  );
}
