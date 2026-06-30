"use client";

import { renderToStaticMarkup } from "react-dom/server";
import L, { type LatLngExpression } from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";

// Mini-mapa de solo lectura para el detalle del centro. Sin interacción para no
// secuestrar el scroll del sheet.
export function CentroLocationMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const position: LatLngExpression = [latitude, longitude];

  const icon = L.divIcon({
    className: "",
    html: renderToStaticMarkup(
      <span className="relative block size-5.5 rounded-[50%_50%_50%_0] border-[2.5px] border-(--superficie) bg-(--color-tierra) -rotate-45 shadow-[0_1px_2px_rgba(31,27,23,0.2),0_6px_14px_rgba(31,27,23,0.28)]">
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-2 rounded-full bg-(--superficie) opacity-85" />
      </span>,
    ),
    iconSize: [32, 36],
    iconAnchor: [16, 36],
  });

  return (
    <MapContainer
      center={position}
      zoom={16}
      minZoom={5}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      zoomControl={false}
      attributionControl={false}
      className="relative z-0 h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={icon} interactive={false} />
    </MapContainer>
  );
}
