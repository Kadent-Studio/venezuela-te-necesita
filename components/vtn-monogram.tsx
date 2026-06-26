export function VtnMonogram({ className = "size-9" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[7px] ${className}`}
      style={{
        background:
          "linear-gradient(135deg, var(--color-critico) 0 50%, var(--color-alto) 50% 100%)",
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.18) inset, 0 1px 2px rgba(31,27,23,0.18)",
      }}
    >
      <span
        className="font-extrabold leading-none tracking-[-0.06em] text-[0.72em]"
        style={{ color: "var(--hueso)" }}
      >
        VTN
      </span>
    </span>
  );
}
