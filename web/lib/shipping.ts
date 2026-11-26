import { FREE_OVER } from "./data";
import type { ShipRates } from "./store";

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

/** Rate for a city, falling back to Lahore's (or the first) when the city is unknown. */
export const rateFor = (rates: ShipRates, city: string) => rates[city] ?? rates.Lahore ?? Object.values(rates)[0] ?? { d: 3, f: 0, free: false };

/** Delivery fee for a city and subtotal. Cities marked free get free delivery over FREE_OVER. */
export function shipFee(rates: ShipRates, city: string, sub: number): number {
  const r = rateFor(rates, city);
  return r.free && sub >= FREE_OVER ? 0 : r.f;
}
