import { BY, FIN, type FinishId, type Product } from "./data";

export type Mode = "retail" | "dealer";
export type CartLine = { id: string; fin: FinishId | ""; qty: number };

export const packOf = (p: Product) => p.pack ?? "carton";
export const isPlastic = (p: Product) => p.id.startsWith("AP-");
/** "colour" for plastic, "finish" for metal fittings. */
export const finWord = (p: Product) => (isPlastic(p) ? "colour" : "finish");
export const slabLabels = (p: Product) =>
  p.carton > 1 ? ["1–4 ctn", "5–19 ctn", "20+ ctn"] : ["1–4 pcs", "5–19 pcs", "20+ pcs"];

/** Dealer slab for a quantity in pieces: 0 for 1–4 cartons, 1 for 5–19, 2 for 20+. */
export function slabIndex(p: Product, qty: number): 0 | 1 | 2 {
  const ctn = qty / p.carton;
  return ctn >= 20 ? 2 : ctn >= 5 ? 1 : 0;
}

/** Price of one piece in a finish, at retail or at the dealer slab for this quantity. */
export function unitPrice(p: Product, fin: FinishId | "", qty: number, mode: Mode): number {
  const m = fin ? FIN[fin].mult : 1;
  return (mode === "dealer" ? p.slabs[slabIndex(p, qty)] : p.price) * m;
}

/** Price used for room hotspots: retail, or the best dealer slab. */
export function lookPrice(id: string, fin: FinishId | undefined, mode: Mode): number {
  const p = BY[id];
  const m = fin ? FIN[fin].mult : 1;
  return (mode === "dealer" ? p.slabs[2] : p.price) * m;
}

export const lineTotal = (l: CartLine, mode: Mode) => unitPrice(BY[l.id], l.fin, l.qty, mode) * l.qty;
export const cartSum = (cart: CartLine[], mode: Mode) => cart.reduce((a, l) => a + lineTotal(l, mode), 0);
export const cartCount = (cart: CartLine[]) => cart.reduce((a, l) => a + l.qty, 0);
