import { z } from "zod";
import type { Product } from "@/lib/data";

/** Mobile number as digits only: "0300-1234567" and "+92 300 1234567" both become "03001234567". */
export function normalisePhone(v: string): string {
  const d = v.replace(/\D/g, "");
  return d.length === 12 && d.startsWith("92") ? "0" + d.slice(2) : d;
}

export const signInSchema = z.object({
  phone: z.string().refine((v) => /^03\d{9}$/.test(normalisePhone(v)), "Enter a mobile number like 0300-1234567"),
  pin: z.string().regex(/^\d{4,6}$/, "Enter your 4 to 6 digit PIN"),
});
export type SignIn = z.infer<typeof signInSchema>;

/** Dealer fields the portal shows. Never the PIN hash. */
export type DealerInfo = {
  name: string;
  initials: string;
  city: string;
  tier: string;
  since: number;
  manager: string;
};

/** One order in the dealer's list. stage is the index into STAGES, or -1 when cancelled. */
export type DealerOrder = { no: string; day: string; items: number; cartons: number; total: number; stage: number };

/** A line to put back in the cart. qty is in pieces. */
export type ReorderLine = { id: string; fin: string; qty: number };

/** "All" plus every catalogue category, in catalogue order. */
export function dealerCats(catalog: Product[]) {
  const c = ["All"];
  for (const p of catalog) if (!c.includes(p.cat)) c.push(p.cat);
  return c;
}
