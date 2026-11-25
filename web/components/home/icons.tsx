// Line icons used only on the homepage (24px grid, currentColor).
type P = React.SVGProps<SVGSVGElement>;
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const ArrowIcon = (p: P) => (
  <svg {...base} strokeWidth={2} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const TickIcon = (p: P) => (
  <svg {...base} strokeWidth={2} {...p}><path d="m5 12 5 5 9-10" /></svg>
);
export const LockIcon = (p: P) => (
  <svg {...base} width={14} height={14} strokeWidth={2} {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
export const PrevIcon = (p: P) => (
  <svg {...base} strokeWidth={2} {...p}><path d="M15 6l-6 6 6 6" /></svg>
);
export const NextIcon = (p: P) => (
  <svg {...base} strokeWidth={2} {...p}><path d="M9 6l6 6-6 6" /></svg>
);
export const CardIcon = (p: P) => (
  <svg {...base} strokeWidth={1.6} {...p}><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20M6 15h4" /></svg>
);
export const ShieldIcon = (p: P) => (
  <svg {...base} strokeWidth={1.6} {...p}><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const TruckIcon = (p: P) => (
  <svg {...base} strokeWidth={1.6} {...p}><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>
);
export const ChatIcon = (p: P) => (
  <svg {...base} strokeWidth={1.6} {...p}><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.2L4 20Z" /><path d="M9 10c.4 2 2 3.6 4 4" /></svg>
);
