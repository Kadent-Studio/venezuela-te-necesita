"use client";

import { useEffect, useMemo } from "react";
import L, { type LatLngExpression } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

type Point = {
  latitude: number;
  longitude: number;
};

const MAIQUETIA_CENTER: LatLngExpression = [10.5967, -66.9562];
const VENEZUELA_BOUNDS: L.LatLngBoundsExpression = [
  [0.6, -73.4],
  [12.3, -59.8],
];

function Recenter({ point }: { point: Point | null }) {
  const map = useMap();
  useEffect(() => {
    if (!point) return;
    map.setView([point.latitude, point.longitude], Math.max(map.getZoom(), 14), {
      animate: true,
    });
  }, [map, point]);
  return null;
}

function ClickTarget({ onPick }: { onPick: (point: Point) => void }) {
  useMapEvents({
    click(e) {
      onPick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}

export function LocationPickerMap({
  value,
  onChange,
}: {
  value: Point | null;
  onChange: (point: Point) => void;
}) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: '<span class="block size-6 rounded-full border-[3px] border-white bg-[var(--color-tierra)] shadow-[0_6px_18px_rgba(31,27,23,0.35)]"></span>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    [],
  );

  const position: LatLngExpression | null = value
    ? [value.latitude, value.longitude]
    : null;

  return (
    <MapContainer
      center={position ?? MAIQUETIA_CENTER}
      zoom={position ? 14 : 5}
      minZoom={5}
      maxBounds={VENEZUELA_BOUNDS}
      maxBoundsViscosity={0.75}
      scrollWheelZoom={false}
      className="relative z-0 h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickTarget onPick={onChange} />
      {value && <Recenter point={value} />}
      {position && (
        <Marker
          draggable
          icon={icon}
          position={position}
          eventHandlers={{
            dragend(e) {
              const marker = e.target as L.Marker;
              const next = marker.getLatLng();
              onChange({ latitude: next.lat, longitude: next.lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
