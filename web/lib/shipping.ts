import { FREE_OVER, SHIP } from "./data";

/** Delivery date after a number of working days (Sundays skipped). */
export function etaDate(days: number, from = new Date()): Date {
  const d = new Date(from);
  let n = 0;
  while (n < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) n++;
  }
  return d;
}

/** Delivery fee for a city and subtotal. Gujranwala and Lahore are free over FREE_OVER. */
export function shipFee(city: string, sub: number): number {
  const s = SHIP[city] ?? SHIP.Lahore;
  if ((city === "Gujranwala" || city === "Lahore") && sub >= FREE_OVER) return 0;
  return s.f;
}
