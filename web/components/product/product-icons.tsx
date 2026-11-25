// Line icons used only on the product page (24px grid, currentColor), from the v7 ICON set.
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
export const ReturnIcon = (p: P) => (
  <svg {...base} strokeWidth={1.6} {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></svg>
);
export const CashIcon = (p: P) => (
  <svg {...base} strokeWidth={1.6} {...p}><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20M6 15h4" /></svg>
);
export const PlayIcon = (p: P) => (
  <svg {...base} strokeWidth={1.6} {...p}><circle cx="12" cy="12" r="9" /><path d="m10 8.5 5 3.5-5 3.5z" /></svg>
);
export const BoxIcon = (p: P) => (
  <svg {...base} strokeWidth={1.6} {...p}><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" /><path d="m3 7.5 9 4.5 9-4.5M12 12v9" /></svg>
);
