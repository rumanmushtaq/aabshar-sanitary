import { CATALOG, DEALER, LEDGER, ORDERS } from "@/lib/data";

export const MOBILE = /^03\d{2}-?\d{7}$/;
export const AVAILABLE = DEALER.limit - DEALER.used;
export const DUE = new Date(DEALER.due + "T00:00:00+05:00");

/** Ledger rows, newest first, with the balance after each entry. */
export function ledgerRows() {
  let bal = DEALER.used;
  return LEDGER.map(([d, ref, detail, dr, cr]) => {
    const row = { d, ref, detail, dr, cr, bal };
    bal = bal - dr + cr;
    return row;
  });
}

/** "All" plus every catalogue category, in catalogue order. */
export function dealerCats() {
  const c = ["All"];
  for (const p of CATALOG) if (!c.includes(p.cat)) c.push(p.cat);
  return c;
}

/** Total of the orders placed in the month of the latest order (the demo's "this month"). */
export function monthBuy() {
  const month = ORDERS[0]?.date.slice(0, 7);
  return ORDERS.filter((o) => o.date.startsWith(month)).reduce((a, o) => a + o.total, 0);
}
