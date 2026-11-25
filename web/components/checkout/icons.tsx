// Icons used by the checkout and dealer portal (v7 ICON set), not in components/icons.tsx.
type P = React.SVGProps<SVGSVGElement>;
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const CheckIcon = (p: P) => (
  <svg {...base} strokeWidth={2} {...p}><path d="m5 12 5 5 9-10" /></svg>
);
export const TruckIcon = (p: P) => (
  <svg {...base} strokeWidth={1.6} {...p}><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>
);
export const ShieldIcon = (p: P) => (
  <svg {...base} strokeWidth={1.6} {...p}><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const BackIcon = (p: P) => (
  <svg {...base} strokeWidth={1.6} {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></svg>
);
export const DownloadIcon = (p: P) => (
  <svg {...base} strokeWidth={1.8} {...p}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
);
export const BoxIcon = (p: P) => (
  <svg {...base} strokeWidth={1.6} {...p}><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" /><path d="m3 7.5 9 4.5 9-4.5M12 12v9" /></svg>
);
