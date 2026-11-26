// Checkout, order tracking and newsletter schemas, shared by the forms (client) and the server actions.
// Also the price quote, so the browser shows exactly the total the server will charge.
import { z } from "zod";
import { LOCALES } from "./i18n/config";
import type { PayId } from "./data";
import { unitPrice, type ById, type CartLine, type Mode } from "./pricing";
import { shipFee } from "./shipping";
import type { ShipRates } from "./store";

export const MOBILE = /^03\d{2}-?\d{7}$/;
export const NEXT_DAY_FEE = 450;
/** Cities with next-day delivery (v7). */
export const NEXT_DAY_CITIES = ["Gujranwala", "Lahore"];
export const nextDayCity = (c: string) => NEXT_DAY_CITIES.includes(c);
export const phoneDigits = (s: string) => s.replace(/\D/g, "");

const mobile = z.string().max(20).refine((v) => MOBILE.test(v.replace(/\s/g, "")), "Enter a mobile number like 0300-1234567");

/** Contact, address, delivery and payment fields of the checkout form. */
export const contactSchema = z.object({
  name: z.string().max(80, "Enter your full name").refine((v) => v.trim().length >= 3, "Enter your full name"),
  phone: mobile,
  email: z.string().max(120, "Check this email address").refine((v) => !v || /^\S+@\S+\.\S+$/.test(v), "Check this email address"),
  city: z.string().max(40).refine((v) => v.trim().length > 0, "Choose a city from the list"),
  area: z.string().max(80, "Enter your area").refine((v) => v.trim().length >= 2, "Enter your area"),
  addr: z.string().max(200, "Enter your house number and street").refine((v) => v.trim().length >= 4, "Enter your house number and street"),
  mark: z.string().max(120),
  speed: z.enum(["std", "exp"], { error: "Choose a delivery speed" }),
  pay: z.enum(["cod", "jazz", "easy", "bank", "credit"], { error: "Choose a payment method" }),
  promo: z.string().max(40),
});
export type ContactValues = z.infer<typeof contactSchema>;
export type ContactField = keyof ContactValues;
export const CONTACT_FIELDS = Object.keys(contactSchema.shape) as ContactField[];

export const lineSchema = z.object({
  id: z.string().min(1).max(40),
  fin: z.string().max(20),
  qty: z.number().int().min(1).max(100_000),
});

/** What the browser sends to placeOrder: cart lines (SKU, finish, pieces) and the form. Never prices. */
export const orderSchema = contactSchema.extend({
  lines: z.array(lineSchema).min(1).max(100),
  lang: z.enum(LOCALES),
  /** Total the shopper saw; the order is refused when the server's total differs (prices changed). */
  seen: z.number().int().nonnegative().optional(),
});
export type OrderInput = z.infer<typeof orderSchema>;

export type PlaceResult =
  | { ok: true; no: string; total: number; name: string; phone: string; pay: PayId; eta: string }
  | {
      ok: false;
      /** English message, translated by the client; "stock" and "unavailable" name a product by sku. */
      error: string;
      field?: ContactField;
      sku?: string;
      left?: number;
    };

/** Prices for cart lines in a mode. Unit prices are rounded to whole rupees, as stored on the order. */
export function quote(
  lines: CartLine[],
  by: ById,
  mode: Mode,
  o: { rates: ShipRates; city: string; speed: "std" | "exp" | "truck"; pct: number },
) {
  const priced = lines.map((l) => {
    const p = by[l.id];
    const unit = p ? Math.round(unitPrice(p, l.fin, l.qty, mode)) : 0;
    return { ...l, unit, total: unit * l.qty };
  });
  const sub = priced.reduce((a, l) => a + l.total, 0);
  const disc = Math.round((sub * o.pct) / 100);
  const fee = mode === "dealer" ? 0 : o.speed === "exp" ? NEXT_DAY_FEE : shipFee(o.rates, o.city, sub);
  return { lines: priced, sub, disc, fee, total: sub - disc + fee };
}

/* ---------- order tracking ---------- */

export const trackSchema = z.object({
  no: z.string().trim().min(3, "Enter your order number").max(20, "Enter your order number"),
  phone: mobile,
});
export type TrackValues = z.infer<typeof trackSchema>;

export type OrderStatus = "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";

export type TrackResult =
  | {
      ok: true;
      no: string;
      status: OrderStatus;
      pcs: number;
      total: number;
      created: string;
      events: { status: OrderStatus; at: string }[];
    }
  | { ok: false; error: string };

/** "ab-104321" or "104321" -> "AB-104321"; other numbers (ORD-10432) are upper-cased. */
export const normOrderNo = (s: string) => {
  const v = s.trim().toUpperCase().replace(/\s+/g, "");
  return /^\d{6}$/.test(v) ? "AB-" + v : v;
};

/* ---------- newsletter ---------- */

export const newsSchema = z.object({ email: z.email().max(120) });
export const subscribeSchema = newsSchema.extend({ lang: z.enum(LOCALES) });
