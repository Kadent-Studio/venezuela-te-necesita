"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Field, Input } from "@/components/ui/form";
import { IconLocate, IconPin, IconSearch } from "@/components/ui/icons";

type Point = {
  latitude: number;
  longitude: number;
};

type GeocodeResult = Point & {
  id: string;
  label: string;
  kind: string;
};

const Map = dynamic(
  () => import("@/components/location-picker-map").then((m) => m.LocationPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-polvo text-sm font-medium text-ceniza-3">
        Cargando mapa...
      </div>
    ),
  },
);

export function LocationPicker({
  value,
  accuracyMeters,
  error,
  onChange,
}: {
  value: Point | null;
  accuracyMeters: number | null;
  error?: string;
  onChange: (point: Point, accuracyMeters?: number | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [status, setStatus] = useState<string | null>(
    value
      ? "El pin empieza en Maiquetia. Muevelo hasta el punto real."
      : "Busca una zona o toca el mapa para colocar el pin.",
  );
  const [busy, setBusy] = useState(false);

  function pick(point: Point, accuracy: number | null = null) {
    onChange(point, accuracy);
    setStatus("Pin colocado. Ajusta el punto si hace falta.");
  }

  async function search() {
    const q = query.trim();
    if (q.length < 2) {
      setStatus("Escribe una ciudad, sector o punto de referencia.");
      return;
    }

    setBusy(true);
    setStatus("Buscando zona...");
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("geocode failed");
      const data = (await res.json()) as { items: GeocodeResult[] };
      setResults(data.items);
      const first = data.items[0];
      if (!first) {
        setStatus("No encontramos esa zona. Prueba con ciudad y sector.");
        return;
      }
      pick({ latitude: first.latitude, longitude: first.longitude }, null);
      setStatus("Zona encontrada. Mueve el pin hasta el punto exacto.");
    } catch {
      setStatus("No se pudo buscar ahora. Puedes usar tu ubicación o tocar el mapa.");
    } finally {
      setBusy(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setStatus("Tu dispositivo no permite usar ubicación. Busca una zona o toca el mapa.");
      return;
    }

    setBusy(true);
    setStatus("Obteniendo ubicación...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pick(
          {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
          Math.round(pos.coords.accuracy),
        );
        setBusy(false);
      },
      () => {
        setStatus("No se pudo obtener la ubicación. Busca una zona o toca el mapa.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <Field label="Buscar ciudad o sector" required>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  search();
                }
              }}
              placeholder="Ej. Catia La Mar, Maracay centro"
              autoComplete="street-address"
            />
          </Field>
        </div>
        <button
          type="button"
          onClick={search}
          disabled={busy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-input)] border px-3 text-sm font-semibold text-ceniza-2 disabled:opacity-60 sm:mt-[29px] sm:h-10 sm:w-28"
        >
          <IconSearch className="size-4" />
          Buscar
        </button>
      </div>

      <button
        type="button"
        onClick={useMyLocation}
        disabled={busy}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-input)] border px-3 text-sm font-semibold text-tierra disabled:opacity-60 sm:h-10 sm:w-fit"
        style={{ borderColor: "var(--color-tierra)" }}
      >
        <IconLocate className="size-4" />
        Usar mi ubicación
      </button>

      {results.length > 1 && (
        <div className="flex flex-col gap-1 rounded-[var(--radius-input)] border bg-polvo p-2">
          {results.slice(0, 3).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                pick({ latitude: item.latitude, longitude: item.longitude }, null)
              }
              className="flex items-start gap-2 rounded-[var(--radius-input)] px-2 py-1.5 text-left text-xs font-medium text-ceniza-2 hover:bg-superficie"
            >
              <IconPin className="mt-0.5 size-4 shrink-0 text-tierra" />
              <span className="line-clamp-2">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      <div
        className="h-[300px] overflow-hidden rounded-[var(--radius-input)] border bg-polvo sm:h-[280px]"
        aria-label="Mapa para elegir ubicación"
      >
        <Map value={value} onChange={(point) => pick(point, null)} />
      </div>

      <div className="flex items-start gap-2 text-xs text-ceniza-3">
        <IconPin className="mt-0.5 size-4 shrink-0" />
        <p>
          {status}
          {accuracyMeters != null ? ` Precisión GPS: ±${accuracyMeters} m.` : ""}
        </p>
      </div>
      {error && (
        <p className="text-xs font-medium" style={{ color: "var(--color-critico)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
