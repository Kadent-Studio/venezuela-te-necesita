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

const baseInput =
  "w-full rounded-[var(--radius-input)] border bg-polvo px-3 py-2 text-sm text-ceniza placeholder:text-ceniza-4";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${baseInput} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${baseInput} min-h-20 resize-y ${props.className ?? ""}`}
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
      className="rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors"
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
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        const accent = colorFor?.(o.value) ?? "var(--color-tierra)";
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className="rounded-[var(--radius-input)] border px-3 py-1.5 text-sm font-semibold transition-colors"
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
    <label className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-input)] border bg-polvo px-3 py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[var(--color-tierra)]"
      />
      <span className="text-sm font-medium text-ceniza-2">{label}</span>
    </label>
  );
}
