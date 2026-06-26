import type { SVGProps } from "react";

// Set único de iconos, trazo 1.75, 24x24, currentColor. Clarifican, no decoran.
function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export const IconUsers = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M16 19a4 4 0 0 0-8 0" />
    <circle cx="12" cy="9" r="3" />
    <path d="M5 19a3 3 0 0 1 3-3M19 19a3 3 0 0 0-3-3" />
  </Base>
);

export const IconInjured = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 7v10M7 12h10" />
    <circle cx="12" cy="12" r="9" />
  </Base>
);

export const IconChild = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="12" cy="6" r="2.2" />
    <path d="M12 8.5V15M9 11h6M10 21l2-3 2 3" />
  </Base>
);

export const IconElder = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="11" cy="5" r="2" />
    <path d="M11 7v8l-2 6M11 11h3M17 21V9" />
  </Base>
);

export const IconClock = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Base>
);

export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Base>
);

export const IconPin = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Base>
);

export const IconNavigation = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M3 11 21 3l-8 18-2-8z" />
  </Base>
);

export const IconCamera = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
    <circle cx="12" cy="13" r="3.2" />
  </Base>
);

export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconX = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
);

export const IconLocate = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </Base>
);

export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6" />
    <path d="m16 16 4 4" />
  </Base>
);
