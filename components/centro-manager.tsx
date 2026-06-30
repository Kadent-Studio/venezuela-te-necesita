"use client";

import { useState } from "react";
import Link from "next/link";
import type { PublicCentroDTO } from "@/lib/types";
import { supplyTypeOrder } from "@/lib/labels";
import { isStockStale } from "@/lib/centros";
import { timeAgo } from "@/lib/time";
import { useCentro, useUpdateCentro, useUpdateCentroItems } from "@/lib/hooks";
import {
  CentroStockEditor,
  stockStateFromItems,
  type StockState,
} from "@/components/centro-stock-editor";
import { ManageLinkCard } from "@/components/manage-link-card";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { IconCheck, IconClock } from "@/components/ui/icons";

export function CentroManager({ id, token }: { id: string; token: string }) {
  const { data: centro, isLoading, isError } = useCentro(id);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-3 px-4 py-10">
        <div className="h-8 w-2/3 animate-pulse rounded bg-polvo" />
        <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-polvo" />
      </div>
    );
  }

  if (isError || !centro) {
    return (
      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-ceniza">Centro no encontrado</h1>
        <p className="mt-2 text-sm text-ceniza-2">
          El enlace puede ser incorrecto.
        </p>
        <Link
          href="/centros"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-[var(--radius-input)] px-4 text-sm font-bold text-[var(--superficie)]"
          style={{ background: "var(--color-tierra)" }}
        >
          Ir al mapa de centros
        </Link>
      </div>
    );
  }

  // `key` fija el estado inicial al primer dato cargado, sin clobber por refetch.
  return <CentroManagerForm key={centro.id} centro={centro} id={id} token={token} />;
}

function CentroManagerForm({
  centro,
  id,
  token,
}: {
  centro: PublicCentroDTO;
  id: string;
  token: string;
}) {
  const [stock, setStock] = useState<StockState>(() =>
    stockStateFromItems(centro.items),
  );
  const [name, setName] = useState(centro.name);
  const [horario, setHorario] = useState(centro.horario ?? "");
  const [encargadoName, setEncargadoName] = useState(centro.encargadoName ?? "");
  const [encargadoPhone, setEncargadoPhone] = useState(
    centro.encargadoPhone ?? "",
  );

  const updateItems = useUpdateCentroItems(id, token);
  const updateCentro = useUpdateCentro(id, token);

  const tokenError =
    updateItems.error || updateCentro.error
      ? "No se pudo guardar. Revisa que tu enlace de gestión sea válido."
      : null;

  const stale = isStockStale(centro.lastStockUpdatedAt);

  function saveItems() {
    const items = supplyTypeOrder.map((st) => ({
      supplyType: st,
      level: stock[st].level,
      ...(stock[st].note.trim() ? { note: stock[st].note.trim() } : {}),
    }));
    updateItems.mutate(items);
  }

  function saveCentro() {
    updateCentro.mutate({
      name: name.trim(),
      horario: horario.trim() || null,
      encargadoName: encargadoName.trim() || null,
      encargadoPhone: encargadoPhone.trim() || null,
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-1">
        <Link
          href="/centros"
          className="inline-flex h-9 w-fit items-center text-sm font-semibold text-ceniza-3 hover:text-ceniza"
        >
          ← Mapa de centros
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-ceniza">
          {centro.name}
        </h1>
        <p className="inline-flex items-center gap-1.5 text-sm text-ceniza-2">
          <IconClock className="size-4 text-ceniza-3" />
          Inventario actualizado {timeAgo(centro.lastStockUpdatedAt)}
        </p>
        {stale ? (
          <p
            className="mt-1 rounded-[var(--radius-input)] px-2.5 py-1.5 text-xs font-medium"
            style={{
              color: "var(--color-alto)",
              background:
                "color-mix(in srgb, var(--color-alto) 10%, var(--superficie))",
            }}
          >
            Lleva más de 24 h sin actualizar. Aunque no cambie nada, vuelve a
            guardar para que los donantes sepan que el dato es real.
          </p>
        ) : null}
      </div>

      {tokenError ? (
        <p
          className="rounded-[var(--radius-input)] border px-3 py-2 text-sm font-medium"
          style={{
            color: "var(--color-critico)",
            borderColor: "var(--color-critico)",
            background:
              "color-mix(in srgb, var(--color-critico) 8%, var(--superficie))",
          }}
        >
          {tokenError}
        </p>
      ) : null}

      {/* Semáforo (lo principal) */}
      <section className="flex flex-col gap-3 rounded-[var(--radius-card)] border bg-superficie p-4 sm:p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ceniza-3">
            ¿Qué falta ahora?
          </h2>
          <p className="text-xs text-ceniza-3">
            Marca <strong>Sobrado</strong> lo que ya tengan de más para que no
            sigan trayéndolo.
          </p>
        </div>
        <CentroStockEditor value={stock} onChange={setStock} />
        <SaveButton
          onClick={saveItems}
          pending={updateItems.isPending}
          saved={updateItems.isSuccess && !updateItems.isPending}
          label="Guardar inventario"
        />
      </section>

      {/* Datos del centro */}
      <section className="flex flex-col gap-3 rounded-[var(--radius-card)] border bg-superficie p-4 sm:p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ceniza-3">
          Datos del centro
        </h2>
        <Field label="Nombre del centro">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Horario de atención" hint="Opcional">
          <Input
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            placeholder="Lun–Sáb, 8am–6pm"
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Encargado">
            <Input
              value={encargadoName}
              onChange={(e) => setEncargadoName(e.target.value)}
            />
          </Field>
          <Field label="Teléfono / WhatsApp">
            <Input
              value={encargadoPhone}
              onChange={(e) => setEncargadoPhone(e.target.value)}
              inputMode="tel"
            />
          </Field>
        </div>
        <SaveButton
          onClick={saveCentro}
          pending={updateCentro.isPending}
          saved={updateCentro.isSuccess && !updateCentro.isPending}
          label="Guardar datos"
        />
      </section>

      {/* Reabrir/compartir el enlace */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ceniza-3">
          Tu enlace de gestión
        </h2>
        <ManageLinkCard id={id} token={token} />
      </section>
    </main>
  );
}

function SaveButton({
  onClick,
  pending,
  saved,
  label,
}: {
  onClick: () => void;
  pending: boolean;
  saved: boolean;
  label: string;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="h-11 w-full text-sm font-bold active:scale-[0.99] disabled:opacity-60 sm:w-fit sm:px-6"
    >
      {pending ? (
        "Guardando…"
      ) : saved ? (
        <span className="inline-flex items-center gap-1.5">
          <IconCheck className="size-4" /> Guardado
        </span>
      ) : (
        label
      )}
    </Button>
  );
}
