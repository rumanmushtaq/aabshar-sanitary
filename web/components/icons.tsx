// Line icons shared across screens (24px grid, currentColor).
type P = React.SVGProps<SVGSVGElement>;
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const EyeIcon = (p: P) => (
  <svg {...base} strokeWidth={1.8} {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const SearchIcon = (p: P) => (
  <svg {...base} strokeWidth={1.8} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const BagIcon = (p: P) => (
  <svg {...base} strokeWidth={1.7} {...p}><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base} strokeWidth={2} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const ChevronIcon = (p: P) => (
  <svg {...base} strokeWidth={2.4} className="chev" {...p}><path d="m6 9 6 6 6-6" /></svg>
);
export const WhatsAppIcon = (p: P) => (
  <svg {...base} strokeWidth={1.8} {...p}><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.2L4 20Z" /><path d="M9 10c.4 2 2 3.6 4 4" /></svg>
);
