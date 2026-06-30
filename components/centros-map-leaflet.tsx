"use client";

import { useEffect } from "react";
import L, { type LatLngExpression } from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { PublicCentroDTO } from "@/lib/types";
import { CentrosMapClusterLayer } from "@/components/centros-map-cluster";

// Los centros pueden estar en el exterior (diáspora), así que el mapa es global;
// la vista inicial arranca en Venezuela pero se reencuadra a lo que haya cargado.
const MAIQUETIA_CENTER: LatLngExpression = [10.5967, -66.9562];

function FocusSelected({
  centro,
  reduceMotion,
}: {
  centro: PublicCentroDTO | null;
  reduceMotion: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!centro) return;
    const target: LatLngExpression = [centro.latitude, centro.longitude];
    if (reduceMotion) {
      map.setView(target, Math.max(map.getZoom(), 14));
      return;
    }
    map.flyTo(target, Math.max(map.getZoom(), 14), {
      duration: 0.55,
      easeLinearity: 0.25,
    });
  }, [map, reduceMotion, centro]);

  return null;
}

function FitCentros({ centros }: { centros: PublicCentroDTO[] }) {
  const map = useMap();

  useEffect(() => {
    if (centros.length === 0) return;
    const bounds = L.latLngBounds(centros.map((c) => [c.latitude, c.longitude]));
    map.fitBounds(bounds.pad(0.18), { maxZoom: 13, animate: false });
  }, [map, centros]);

  return null;
}

export function CentrosMapLeaflet({
  centros,
  selectedId,
  reduceMotion,
  onSelect,
}: {
  centros: PublicCentroDTO[];
  selectedId: string | null;
  reduceMotion: boolean;
  onSelect: (id: string) => void;
}) {
  const selectedCentro = centros.find((c) => c.id === selectedId) ?? null;

  return (
    <MapContainer
      center={MAIQUETIA_CENTER}
      zoom={6}
      minZoom={2}
      worldCopyJump
      scrollWheelZoom
      className="relative z-0 h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {centros.length > 0 && <FitCentros centros={centros} />}
      <FocusSelected centro={selectedCentro} reduceMotion={reduceMotion} />
      <CentrosMapClusterLayer
        centros={centros}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </MapContainer>
  );
}
