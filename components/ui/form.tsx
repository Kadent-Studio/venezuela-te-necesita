"use client";

import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ceniza">
        {label}
        {required && <span className="text-critico"> *</span>}
      </span>
      {hint && <span className="-mt-1 text-xs text-ceniza-3">{hint}</span>}
      {children}
      {error && (
        <span className="text-xs font-medium" style={{ color: "var(--color-critico)" }}>
          {error}
        </span>
      )}
    </label>
  );
}

// h-11 (44px) en móvil: tap target accesible bajo estrés / dedos con polvo.
// sm:h-10 vuelve a la densidad de escritorio.
const baseInput =
  "w-full rounded-[var(--radius-input)] border bg-polvo px-3.5 text-base text-ceniza placeholder:text-ceniza-4 h-11 sm:h-10 sm:text-sm";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${baseInput} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-[var(--radius-input)] border bg-polvo px-3.5 py-2.5 text-base text-ceniza placeholder:text-ceniza-4 sm:text-sm min-h-24 resize-y ${props.className ?? ""}`}
    />
  );
}

export function ToggleChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="inline-flex h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors active:scale-[0.98] sm:h-9 sm:px-3.5"
      style={
        active
          ? {
              color: "var(--superficie)",
              background: "var(--color-tierra)",
              borderColor: "var(--color-tierra)",
            }
          : { color: "var(--color-ceniza-2)", borderColor: "var(--borde-fuerte)" }
      }
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  colorFor,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  colorFor?: (v: T) => string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {options.map((o) => {
        const active = o.value === value;
        const accent = colorFor?.(o.value) ?? "var(--color-tierra)";
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-input)] border px-3.5 text-sm font-semibold transition-colors active:scale-[0.98] sm:h-9"
            style={
              active
                ? {
                    color: accent,
                    background: `color-mix(in srgb, ${accent} 14%, var(--superficie))`,
                    borderColor: accent,
                  }
                : { color: "var(--color-ceniza-2)", borderColor: "var(--borde-fuerte)" }
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-input)] border bg-polvo px-3.5 py-2.5 sm:min-h-11 sm:py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 accent-[var(--color-tierra)] sm:size-4"
      />
      <span className="text-sm font-medium text-ceniza-2">{label}</span>
    </label>
  );
}
