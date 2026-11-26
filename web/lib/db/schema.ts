import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/* All money is whole rupees (integer). */

export const orderStatus = pgEnum("order_status", ["confirmed", "packed", "shipped", "delivered", "cancelled"]);
export const orderKind = pgEnum("order_kind", ["retail", "dealer"]);
export const payMethod = pgEnum("pay_method", ["cod", "jazz", "easy", "bank", "credit"]);
export const userRole = pgEnum("user_role", ["admin", "staff"]);

export const products = pgTable("products", {
  id: text("id").primaryKey(), // SKU, e.g. AB-1204
  name: text("name").notNull(),
  /** Urdu shown on /ur pages; falls back to the dictionary, then English. */
  nameUr: text("name_ur"),
  cat: text("cat").notNull(),
  img: text("img"),
  alt: text("alt"),
  pos: text("pos"),
  crop: text("crop"),
  cimg: text("cimg"),
  price: integer("price").notNull(),
  was: integer("was").notNull().default(0),
  carton: integer("carton").notNull().default(1),
  slabs: integer("slabs").array().notNull(), // dealer price per piece: 1–4, 5–19, 20+ cartons
  flag: text("flag"),
  sale: boolean("sale").notNull().default(false),
  fins: text("fins").array().notNull().default(sql`'{}'::text[]`),
  specs: text("specs").array().notNull().default(sql`'{}'::text[]`),
  specsUr: text("specs_ur").array(),
  pt: text("pt"),
  pack: text("pack"),
  sub: text("sub"),
  subUr: text("sub_ur"),
  wty: text("wty"),
  tags: text("tags"),
  stock: integer("stock").notNull().default(0),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Delivery days and fee per city. */
export const shipRates = pgTable("ship_rates", {
  city: text("city").primaryKey(),
  days: integer("days").notNull(),
  fee: integer("fee").notNull(),
  /** Free delivery over the free-delivery threshold. */
  freeOver: boolean("free_over").notNull().default(false),
});

/** Dealer shops listed in "Find a dealer". */
export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(),
  name: text("name").notNull(),
  area: text("area").notNull(),
  phone: text("phone").notNull(),
  sort: integer("sort").notNull().default(0),
});

/** Dealer accounts that order on credit. */
export const dealers = pgTable("dealers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  initials: text("initials").notNull(),
  city: text("city").notNull(),
  phone: text("phone").notNull(), // login, digits only: 03001234567
  pinHash: text("pin_hash").notNull(),
  tier: text("tier").notNull().default("B"),
  since: integer("since").notNull(),
  creditLimit: integer("credit_limit").notNull(),
  /** Days until an order on credit is due. */
  termsDays: integer("terms_days").notNull().default(30),
  manager: text("manager").notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("dealers_phone_idx").on(t.phone)]);

/** Khata: debits are orders on credit, credits are payments and claims. Balance = sum(debit) - sum(credit). */
export const ledger = pgTable("ledger", {
  id: serial("id").primaryKey(),
  dealerId: integer("dealer_id").notNull().references(() => dealers.id),
  day: date("day").notNull(),
  ref: text("ref").notNull(),
  detail: text("detail").notNull(),
  debit: integer("debit").notNull().default(0),
  credit: integer("credit").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("ledger_dealer_idx").on(t.dealerId, t.day)]);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  no: text("no").notNull(), // public order number, e.g. AB-104321
  kind: orderKind("kind").notNull(),
  dealerId: integer("dealer_id").references(() => dealers.id),
  status: orderStatus("status").notNull().default("confirmed"),
  lang: text("lang").notNull().default("en"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  city: text("city").notNull(),
  area: text("area").notNull(),
  addr: text("addr").notNull(),
  mark: text("mark"),
  speed: text("speed").notNull(), // std | exp | truck
  pay: payMethod("pay").notNull(),
  promo: text("promo"),
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").notNull().default(0),
  fee: integer("fee").notNull().default(0),
  total: integer("total").notNull(),
  cartons: integer("cartons").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("orders_no_idx").on(t.no), index("orders_created_idx").on(t.createdAt), index("orders_dealer_idx").on(t.dealerId)]);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  sku: text("sku").notNull(),
  name: text("name").notNull(), // snapshot at order time
  fin: text("fin").notNull().default(""),
  qty: integer("qty").notNull(),
  unitPrice: integer("unit_price").notNull(),
  lineTotal: integer("line_total").notNull(),
}, (t) => [index("order_items_order_idx").on(t.orderId)]);

/** Status history shown on the tracking timeline. */
export const orderEvents = pgTable("order_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatus("status").notNull(),
  note: text("note"),
  by: text("by"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("order_events_order_idx").on(t.orderId)]);

export const promoCodes = pgTable("promo_codes", {
  code: text("code").primaryKey(), // stored upper case
  pct: integer("pct").notNull(),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  lang: text("lang").notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("subscribers_email_idx").on(t.email)]);

/** Staff who use /admin. */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("staff"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("users_email_idx").on(t.email)]);

/** Login sessions. The cookie holds a random token; only its SHA-256 is stored. */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // sha256(token), hex
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  dealerId: integer("dealer_id").references(() => dealers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProductRow = typeof products.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type DealerRow = typeof dealers.$inferSelect;
