// Zod schemas shared by the admin forms (client) and the admin server actions (server).
// Not a "use server" file: it exports values, so both sides can import it.
import { z } from "zod";
import { FIN, type FinishId } from "@/lib/data";

export type ActionResult = { ok: true; msg?: string; id?: string | number } | { ok: false; error: string };

export const ORDER_STATUSES = ["confirmed", "packed", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const FIN_IDS = Object.keys(FIN) as [FinishId, ...FinishId[]];
export const PAY_METHODS = ["Bank", "JazzCash", "Easypaisa", "Cash", "Cheque"] as const;
export const TIERS = ["A", "B", "C"] as const;

/* ---------- helpers ---------- */

const int = (min: number, max: number, label = "Value") =>
  z
    .number({ error: `${label}: enter a whole number` })
    .int(`${label}: enter a whole number`)
    .min(min, `${label}: at least ${min.toLocaleString("en-PK")}`)
    .max(max, `${label}: at most ${max.toLocaleString("en-PK")}`);
const text = (max: number, label = "This field") => z.string().trim().max(max, `${label}: ${max} characters at most`);
const req = (max: number, label: string) => text(max, label).min(1, `${label} is required`);
const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");
const MAX_RS = 100_000_000; // 10 crore

/* ---------- auth / staff ---------- */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter your email").max(200),
  password: z.string().min(1, "Enter your password").max(200),
});
export type LoginInput = z.input<typeof loginSchema>;

export const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password").max(200),
    next: z.string().min(10, "At least 10 characters").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Passwords do not match" });
export type PasswordInput = z.input<typeof passwordSchema>;

export const userSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  name: req(80, "Name"),
  role: z.enum(["admin", "staff"]),
  password: z.string().min(10, "At least 10 characters").max(200),
});
export type UserInput = z.input<typeof userSchema>;

export const idSchema = z.number().int().positive();

/* ---------- orders ---------- */

export const statusSchema = z.object({
  id: idSchema,
  status: z.enum(ORDER_STATUSES),
  note: text(300, "Note"),
});
export type StatusInput = z.input<typeof statusSchema>;

/* ---------- products ---------- */

export const SKU_RE = /^[A-Z0-9][A-Z0-9-]{1,19}$/;
export const productSchema = z
  .object({
    id: z.string().trim().toUpperCase().regex(SKU_RE, "SKU: capital letters, digits and dashes, e.g. AB-1204"),
    name: req(120, "Name"),
    nameUr: text(160, "Urdu name"),
    cat: req(60, "Category"),
    sub: text(200, "Subtitle"),
    subUr: text(260, "Urdu subtitle"),
    price: int(1, MAX_RS, "Price"),
    was: int(0, MAX_RS, "Old price"),
    carton: int(1, 10_000, "Pieces per carton"),
    slabs: z.tuple([int(1, MAX_RS, "Slab 1"), int(1, MAX_RS, "Slab 2"), int(1, MAX_RS, "Slab 3")]),
    flag: text(30, "Badge"),
    sale: z.boolean(),
    fins: z.array(z.enum(FIN_IDS)),
    specs: text(2000, "Specs"),
    specsUr: text(3000, "Urdu specs"),
    pt: z.enum(["", "tanks", "pipes", "home"]),
    pack: z.enum(["", "carton", "bundle", "tank"]),
    wty: text(60, "Warranty"),
    tags: text(300, "Search tags"),
    img: text(200),
    alt: text(200),
    cimg: text(200),
    pos: text(30, "Photo position"),
    crop: text(30, "Crop position"),
    stock: int(0, 10_000_000, "Stock"),
    active: z.boolean(),
    sort: int(-10_000, 10_000, "Sort"),
  })
  .refine((v) => v.slabs[0] >= v.slabs[1] && v.slabs[1] >= v.slabs[2], {
    path: ["slabs"],
    message: "Slab prices should go down as cartons go up",
  });
export type ProductInput = z.input<typeof productSchema>;

export const stockSchema = z.object({
  id: z.string().regex(SKU_RE),
  delta: int(-1_000_000, 1_000_000, "Change").refine((n) => n !== 0, "Enter a change other than 0"),
});
export type StockInput = z.input<typeof stockSchema>;

/* ---------- dealers ---------- */

export const PHONE_RE = /^03\d{9}$/;
const phone = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(PHONE_RE, "Mobile like 03001234567 (11 digits)"));
const pin = z.string().regex(/^\d{4,6}$/, "PIN: 4 to 6 digits");

const dealerBase = {
  name: req(100, "Shop name"),
  initials: z.string().trim().toUpperCase().regex(/^[A-Z]{1,3}$/, "1 to 3 letters"),
  city: req(60, "City"),
  phone,
  tier: z.enum(TIERS),
  since: int(1950, 2100, "Dealer since"),
  creditLimit: int(0, MAX_RS, "Credit limit"),
  termsDays: int(0, 365, "Terms"),
  manager: text(80, "Manager"),
};
export const dealerCreateSchema = z.object({ ...dealerBase, pin });
export type DealerCreateInput = z.input<typeof dealerCreateSchema>;
export const dealerEditSchema = z.object({ id: idSchema, ...dealerBase });
export type DealerEditInput = z.input<typeof dealerEditSchema>;

export const pinSchema = z.object({ id: idSchema, pin });
export type PinInput = z.input<typeof pinSchema>;

export const paymentSchema = z.object({
  dealerId: idSchema,
  amount: int(1, MAX_RS, "Amount"),
  method: z.enum(PAY_METHODS),
  ref: text(40, "Reference"),
  day: isoDay,
  note: text(120, "Note"),
});
export type PaymentInput = z.input<typeof paymentSchema>;

/* ---------- settings ---------- */

export const shipRateSchema = z.object({
  city: req(60, "City"),
  days: int(0, 60, "Days"),
  fee: int(0, 100_000, "Fee"),
  freeOver: z.boolean(),
});
export type ShipRateInput = z.input<typeof shipRateSchema>;

export const shopSchema = z.object({
  id: z.number().int().positive().optional(),
  city: req(60, "City"),
  name: req(100, "Shop name"),
  area: req(100, "Area"),
  phone: req(30, "Phone"),
  sort: int(-1000, 1000, "Sort"),
});
export type ShopInput = z.input<typeof shopSchema>;

export const promoSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,20}$/, "3 to 20 letters or digits"),
  pct: int(1, 50, "Percent"),
  active: z.boolean(),
  expires: z.union([z.literal(""), isoDay]),
});
export type PromoInput = z.input<typeof promoSchema>;
