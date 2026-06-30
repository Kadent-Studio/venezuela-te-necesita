"use client";

import { useState } from "react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import { Field, Input, Textarea } from "@/components/ui/form";
import { IconCamera, IconCheck, IconX } from "@/components/ui/icons";
import { LocationPicker } from "@/components/location-picker";
import {
  CentroStockEditor,
  initialStockState,
  type StockState,
} from "@/components/centro-stock-editor";
import { supplyTypeOrder } from "@/lib/labels";
import { useCreateCentro } from "@/lib/hooks";
import { Button } from "./ui/button";
import { ManageLinkCard } from "./manage-link-card";

type Errors = Record<string, string>;
type Point = { latitude: number; longitude: number };

const MAIQUETIA_LOCATION: Point = {
  latitude: 10.5967,
  longitude: -66.9562,
};

export function CentroForm({ onSuccess }: { onSuccess?: (id: string) => void }) {
  const [location, setLocation] = useState<Point | null>(MAIQUETIA_LOCATION);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [horario, setHorario] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const [encargadoName, setEncargadoName] = useState("");
  const [encargadoPhone, setEncargadoPhone] = useState("");

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState<string | null>(null);

  const [stock, setStock] = useState<StockState>(initialStockState);

  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; manageToken: string } | null>(
    null,
  );

  const createCentro = useCreateCentro();

  const err = (k: string) => errors[k];

  async function onPhoto(file: File) {
    setPhotoErr(null);
    if (!file.type.startsWith("image/")) {
      setPhotoErr("El archivo debe ser una imagen.");
      return;
    }
    setPhotoBusy(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/centros/upload",
      });
      setPhotoUrl(blob.url);
    } catch {
      setPhotoErr("No se pudo subir la foto. Puedes registrar sin ella.");
    } finally {
      setPhotoBusy(false);
    }
  }

  function validate(): Errors {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = "Indica el nombre del centro";
    if (!location) e.location = "Indica la ubicación en el mapa";
    if (address.trim().length < 3) e.address = "Indica una referencia del lugar";
    if (encargadoName.trim().length < 2) e.encargadoName = "Indica un nombre";
    if (encargadoPhone.trim().length < 7)
      e.encargadoPhone = "Indica un teléfono";
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitError(null);
    const local = validate();
    setErrors(local);
    if (Object.keys(local).length > 0) return;

    const items = supplyTypeOrder.map((st) => ({
      supplyType: st,
      level: stock[st].level,
      ...(stock[st].note.trim() ? { note: stock[st].note.trim() } : {}),
    }));

    try {
      const result = await createCentro.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        scope: "VENEZUELA",
        country: "Venezuela",
        state: state.trim() || undefined,
        city: city.trim() || undefined,
        latitude: location?.latitude,
        longitude: location?.longitude,
        accuracyMeters: accuracy ?? undefined,
        address: address.trim(),
        photoUrl: photoUrl ?? undefined,
        encargadoName: encargadoName.trim(),
        encargadoPhone: encargadoPhone.trim(),
        horario: horario.trim() || undefined,
        items,
      });
      setDone(result);
      onSuccess?.(result.id);
    } catch (e: unknown) {
      const data = e as
        | { error?: string; fieldErrors?: Record<string, string[]> }
        | undefined;
      if (data?.fieldErrors) {
        const fe: Errors = {};
        for (const [k, v] of Object.entries(data.fieldErrors)) fe[k] = v[0];
        setErrors(fe);
        setSubmitError("Revisa los campos marcados.");
      } else {
        setSubmitError("No se pudo registrar. Intenta de nuevo en un momento.");
      }
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-5 py-2">
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className="flex size-12 items-center justify-center rounded-full"
            style={{
              color: "var(--color-bajo)",
              background:
                "color-mix(in srgb, var(--color-bajo) 14%, var(--superficie))",
            }}
          >
            <IconCheck className="size-6" />
          </span>
          <h3 className="text-lg font-bold text-ceniza">Centro registrado</h3>
          <p className="max-w-sm text-sm text-ceniza-2">
            Guarda y comparte este <strong>enlace de gestión</strong> con la
            persona encargada in-situ. Con él podrá actualizar qué falta sin
            crear cuenta. <strong>No lo compartas públicamente.</strong>
          </p>
        </div>

        <ManageLinkCard id={done.id} token={done.manageToken} />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/centros/${done.id}/gestionar?token=${encodeURIComponent(done.manageToken)}`}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-[var(--radius-input)] text-sm font-bold text-[var(--superficie)]"
            style={{ background: "var(--color-tierra)" }}
          >
            Gestionar ahora
          </Link>
          <Link
            href="/centros"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-[var(--radius-input)] border text-sm font-semibold text-ceniza-2"
            style={{ borderColor: "var(--borde-fuerte)" }}
          >
            Ver el mapa de centros
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <Section title="Ubicación">
        <LocationPicker
          value={location}
          accuracyMeters={accuracy}
          error={err("location") ?? err("latitude") ?? err("longitude")}
          onChange={(point, nextAccuracy = null) => {
            setLocation(point);
            setAccuracy(nextAccuracy);
          }}
        />
        <Field
          label="Referencia del lugar"
          hint="Sector, ciudad, punto de referencia (ej. cancha techada, entrada principal)"
          error={err("address")}
          required
        >
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Maracay, Av. Bolívar, frente a la plaza"
          />
        </Field>
      </Section>

      <Section title="El centro">
        <Field label="Nombre del centro" error={err("name")} required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Liceo Bolívar — coliseo"
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Ciudad" hint="Opcional">
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Maracay"
            />
          </Field>
          <Field label="Estado" hint="Opcional">
            <Input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Aragua"
            />
          </Field>
        </div>
        <Field label="Horario de atención" hint="Opcional">
          <Input
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            placeholder="Lun–Sáb, 8am–6pm"
          />
        </Field>
        <Field label="Descripción" hint="Opcional — instrucciones de entrega, qué reciben">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles que ayuden a quien viene a donar…"
          />
        </Field>
      </Section>

      <Section title="Contacto del encargado">
        <p className="text-xs text-ceniza-3">
          Público. Aparece en el mapa para que los donantes coordinen entregas.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nombre" error={err("encargadoName")} required>
            <Input
              value={encargadoName}
              onChange={(e) => setEncargadoName(e.target.value)}
              autoComplete="name"
            />
          </Field>
          <Field label="Teléfono / WhatsApp" error={err("encargadoPhone")} required>
            <Input
              value={encargadoPhone}
              onChange={(e) => setEncargadoPhone(e.target.value)}
              inputMode="tel"
              placeholder="+58 412 1234567"
              autoComplete="tel"
            />
          </Field>
        </div>
      </Section>

      <Section title="Foto del centro">
        <p className="text-xs text-ceniza-3">
          Opcional. Ayuda a reconocer el lugar.
        </p>
        {photoUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt="Foto adjunta"
              className="size-16 rounded-[var(--radius-input)] object-cover"
            />
            <button
              type="button"
              onClick={() => setPhotoUrl(null)}
              className="inline-flex items-center gap-1 text-sm font-medium text-ceniza-2"
            >
              <IconX className="size-4" /> Quitar
            </button>
          </div>
        ) : (
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-[var(--radius-input)] border bg-polvo px-3 py-2 text-sm font-semibold text-ceniza-2">
            <IconCamera className="size-4 text-ceniza-3" />
            {photoBusy ? "Subiendo…" : "Adjuntar foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={photoBusy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPhoto(f);
              }}
            />
          </label>
        )}
        {photoErr && (
          <p className="text-xs font-medium" style={{ color: "var(--color-critico)" }}>
            {photoErr}
          </p>
        )}
      </Section>

      <Section title="¿Qué necesitan ahora?">
        <p className="text-xs text-ceniza-3">
          Marca el nivel de cada insumo. Por defecto todo arranca en{" "}
          <strong>Necesita</strong>; baja a <strong>Suficiente</strong> o{" "}
          <strong>Sobrado</strong> lo que ya tengan.
        </p>
        <CentroStockEditor value={stock} onChange={setStock} />
      </Section>

      {submitError && (
        <p
          className="rounded-[var(--radius-input)] border px-3 py-2 text-sm font-medium"
          style={{
            color: "var(--color-critico)",
            borderColor: "var(--color-critico)",
            background: "color-mix(in srgb, var(--color-critico) 8%, var(--superficie))",
          }}
        >
          {submitError}
        </p>
      )}

      <div
        className="sticky bottom-0 mt-2 -mb-4 border-t bg-superficie/95 py-3 max-sm:pb-safe backdrop-blur sm:-mb-5"
        style={{ borderColor: "var(--borde)" }}
      >
        <Button
          type="submit"
          size="lg"
          disabled={createCentro.isPending}
          className="h-12 w-full text-base font-bold active:scale-[0.99] disabled:opacity-60"
        >
          {createCentro.isPending ? "Registrando…" : "Registrar centro de acopio"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-ceniza-3">
        {title}
      </h3>
      {children}
    </section>
  );
}
