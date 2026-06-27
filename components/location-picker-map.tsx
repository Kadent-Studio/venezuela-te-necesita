"use client";

import { useEffect, useMemo } from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
        html: renderToStaticMarkup(
          <span className="relative block size-6.5 rounded-[50%_50%_50%_0] border-[3px] border-(--superficie) bg-(--color-tierra) shadow-[0_2px_4px_rgba(31,27,23,0.2),0_8px_18px_rgba(31,27,23,0.3)] -rotate-45">
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-2.5 rounded-full bg-(--superficie) opacity-85" />
          </span>
        ),
        iconSize: [38, 42],
        iconAnchor: [19, 42],
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
