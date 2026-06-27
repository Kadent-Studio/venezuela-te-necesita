"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import type { NeedType, Urgency, AccessStatus } from "@prisma/client";
import {
  needTypeOrder,
  needTypeLabel,
  urgencyOrder,
  urgencyLabel,
  urgencyColor,
  accessOrder,
  accessLabel,
} from "@/lib/labels";
import {
  Field,
  Input,
  Textarea,
  ToggleChip,
  Segmented,
  CheckRow,
} from "@/components/ui/form";
import { IconCamera, IconCheck, IconX } from "@/components/ui/icons";
import { LocationPicker } from "@/components/location-picker";
import { useCreateReport } from "@/lib/hooks";
import { Button } from "./ui/button";

type Errors = Record<string, string>;
type Point = { latitude: number; longitude: number };

const MAIQUETIA_LOCATION: Point = {
  latitude: 10.5967,
  longitude: -66.9562,
};

export function ReportForm({ onSuccess }: { onSuccess?: (id: string) => void }) {
  const [location, setLocation] = useState<Point | null>(MAIQUETIA_LOCATION);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const [address, setAddress] = useState("");
  const [needTypes, setNeedTypes] = useState<NeedType[]>([]);
  const [urgency, setUrgency] = useState<Urgency | null>(null);
  const [description, setDescription] = useState("");

  const [peopleCount, setPeopleCount] = useState("1");
  const [hasInjured, setHasInjured] = useState(false);
  const [hasChildren, setHasChildren] = useState(false);
  const [hasElderly, setHasElderly] = useState(false);

  const [access, setAccess] = useState<AccessStatus | null>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState<string | null>(null);

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  const createReport = useCreateReport();

  const err = (k: string) => errors[k];

  function toggleNeed(n: NeedType) {
    setNeedTypes((cur) =>
      cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n],
    );
  }

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
        handleUploadUrl: "/api/reports/upload",
      });
      setPhotoUrl(blob.url);
    } catch {
      setPhotoErr("No se pudo subir la foto. Puedes enviar el reporte sin ella.");
    } finally {
      setPhotoBusy(false);
    }
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!location) e.location = "Indica la ubicación en el mapa";
    if (address.trim().length < 3) e.address = "Indica una referencia del lugar";
    if (needTypes.length === 0) e.needTypes = "Elige al menos un tipo de ayuda";
    if (!urgency) e.urgency = "Indica la urgencia";
    if (!access) e.access = "Indica el estado de acceso";
    if (contactName.trim().length < 2) e.contactName = "Indica un nombre";
    if (contactPhone.trim().length < 7) e.contactPhone = "Indica un teléfono";
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitError(null);
    const local = validate();
    setErrors(local);
    if (Object.keys(local).length > 0) return;

    try {
      const { id } = await createReport.mutateAsync({
        latitude: location?.latitude,
        longitude: location?.longitude,
        accuracyMeters: accuracy ?? undefined,
        address: address.trim(),
        needTypes,
        urgency,
        description: description.trim() || undefined,
        peopleCount: Number(peopleCount) || 1,
        hasInjured,
        hasChildren,
        hasElderly,
        access,
        photoUrl: photoUrl ?? undefined,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
      });
      setDoneId(id);
      onSuccess?.(id);
    } catch (err: unknown) {
      const data = err as
        | { error?: string; fieldErrors?: Record<string, string[]> }
        | undefined;
      if (data?.fieldErrors) {
        const fe: Errors = {};
        for (const [k, v] of Object.entries(data.fieldErrors)) {
          fe[k] = v[0];
        }
        setErrors(fe);
        setSubmitError("Revisa los campos marcados.");
      } else if (data?.error?.includes("Demasiados")) {
        setSubmitError("Demasiados envíos. Espera un momento e intenta de nuevo.");
      } else {
        setSubmitError("No se pudo enviar. Intenta de nuevo en un momento.");
      }
    }
  }

  if (doneId) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <span
          className="flex size-12 items-center justify-center rounded-full"
          style={{
            color: "var(--color-bajo)",
            background: "color-mix(in srgb, var(--color-bajo) 14%, var(--superficie))",
          }}
        >
          <IconCheck className="size-6" />
        </span>
        <h3 className="text-lg font-bold text-ceniza">Solicitud enviada</h3>
        <p className="max-w-sm text-sm text-ceniza-2">
          Tu reporte quedó registrado como <strong>sin verificar</strong>. Un
          coordinador lo revisará y aparecerá en el mapa de ayuda.
        </p>
        <p className="font-mono text-xs text-ceniza-3">ID {doneId.slice(0, 8)}</p>
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
          hint="Sector, ciudad, punto de referencia (ej. edificio azul, 3er piso)"
          error={err("address")}
          required
        >
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Catia La Mar, frente a la iglesia"
          />
        </Field>
      </Section>

      <Section title="Necesidad">
        <Field label="¿Qué se necesita?" error={err("needTypes")} required>
          <div className="flex flex-wrap gap-2">
            {needTypeOrder.map((n) => (
              <ToggleChip
                key={n}
                active={needTypes.includes(n)}
                onClick={() => toggleNeed(n)}
              >
                {needTypeLabel[n]}
              </ToggleChip>
            ))}
          </div>
        </Field>
        <Field label="Urgencia" error={err("urgency")} required>
          <Segmented
            options={urgencyOrder.map((u) => ({ value: u, label: urgencyLabel[u] }))}
            value={urgency}
            onChange={setUrgency}
            colorFor={(u) => urgencyColor[u]}
          />
        </Field>
        <Field label="Descripción" hint="Opcional">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles que ayuden a la respuesta…"
          />
        </Field>
      </Section>

      <Section title="Personas afectadas">
        <Field label="¿Cuántas personas?">
          <Input
            type="number"
            min={1}
            value={peopleCount}
            onChange={(e) => setPeopleCount(e.target.value)}
            className="w-28"
          />
        </Field>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <CheckRow checked={hasInjured} onChange={setHasInjured} label="Hay heridos" />
          <CheckRow checked={hasChildren} onChange={setHasChildren} label="Hay niños" />
          <CheckRow
            checked={hasElderly}
            onChange={setHasElderly}
            label="Adultos mayores"
          />
        </div>
      </Section>

      <Section title="Acceso a la zona">
        <Field label="¿Se puede llegar?" error={err("access")} required>
          <Segmented
            options={accessOrder.map((a) => ({ value: a, label: accessLabel[a] }))}
            value={access}
            onChange={setAccess}
          />
        </Field>
      </Section>

      <Section title="Foto del lugar">
        <p className="text-xs text-ceniza-3">
          Opcional. Ayuda a evaluar el daño y la prioridad.
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

      <Section title="Contacto">
        <p className="text-xs text-ceniza-3">
          Privado. Solo lo ven los coordinadores; nunca aparece en el mapa público.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nombre" error={err("contactName")} required>
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              autoComplete="name"
            />
          </Field>
          <Field label="Teléfono" error={err("contactPhone")} required>
            <Input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              inputMode="tel"
              placeholder="+58 412 1234567"
              autoComplete="tel"
            />
          </Field>
        </div>
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
          disabled={createReport.isPending}
          className="h-12 w-full text-base font-bold active:scale-[0.99] disabled:opacity-60"
        >
          {createReport.isPending ? "Enviando…" : "Enviar solicitud de ayuda"}
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
