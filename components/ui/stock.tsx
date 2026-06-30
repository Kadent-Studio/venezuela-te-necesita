import type { StockLevel } from "@prisma/client";
import { stockLevelColor, stockLevelLabel } from "@/lib/labels";

// Chip del semáforo: punto + etiqueta en el color del nivel.
export function StockChip({ level }: { level: StockLevel }) {
  const color = stockLevelColor[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 14%, var(--superficie))`,
      }}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ background: color }}
      />
      {stockLevelLabel[level]}
    </span>
  );
}

// Punto de color del nivel, para listas/marcadores compactos.
export function StockDot({
  level,
  className,
}: {
  level: StockLevel;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block size-2 rounded-full ${className ?? ""}`}
      style={{ background: stockLevelColor[level] }}
    />
  );
}
