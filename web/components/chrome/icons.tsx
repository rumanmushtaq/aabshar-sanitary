// Icons used only by the site chrome (24px grid, currentColor).
type P = React.SVGProps<SVGSVGElement>;
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const GlobeIcon = (p: P) => (
  <svg {...base} strokeWidth={1.6} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3Z" /></svg>
);
export const BurgerIcon = (p: P) => (
  <svg {...base} strokeWidth={1.8} {...p}><path d="M4 7h16M4 12h16M4 17h10" /></svg>
);
export const HomeIcon = (p: P) => (
  <svg {...base} strokeWidth={1.8} {...p}><path d="M4 11 12 4l8 7v9H4z" /><path d="M10 20v-5h4v5" /></svg>
);
export const GridIcon = (p: P) => (
  <svg {...base} strokeWidth={1.8} {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" />
  </svg>
);
