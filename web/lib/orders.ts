import "server-only";
import { randomInt } from "node:crypto";
import { and, asc, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { db, schema } from "./db";
import type { DealerRow } from "./db/schema";
import { toProduct, type ShipRates } from "./store";
import { etaDate } from "./shipping";
import type { Product } from "./data";
import type { ById, CartLine } from "./pricing";
import {
  nextDayCity,
  normOrderNo,
  phoneDigits,
  quote,
  type OrderInput,
  type OrderStatus,
  type PlaceResult,
  type TrackResult,
} from "./checkout-schema";

type Failure = Extract<PlaceResult, { ok: false }>;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Thrown inside the transaction to roll it back and return a failure to the shopper. */
class Refused extends Error {
  constructor(readonly result: Failure) {
    super(result.error);
  }
}

function refuse(r: Omit<Failure, "ok">): never {
  throw new Refused({ ok: false, ...r });
}

/** Today's date in Pakistan, YYYY-MM-DD. */
const todayPk = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());

const isUniqueClash = (e: unknown) => {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "23505" || err?.cause?.code === "23505";
};

/** Khata balance (debits minus credits) of a dealer. */
async function ledgerBalance(q: Tx | typeof db, dealerId: number): Promise<number> {
  const [r] = await q
    .select({ bal: sql<string>`coalesce(sum(${schema.ledger.debit}) - sum(${schema.ledger.credit}), 0)::bigint` })
    .from(schema.ledger)
    .where(eq(schema.ledger.dealerId, dealerId));
  return Number(r?.bal ?? 0);
}

/** Credit a dealer can still use: limit minus khata balance. */
export async function availableCredit(d: DealerRow): Promise<number> {
  return Math.max(0, d.creditLimit - (await ledgerBalance(db, d.id)));
}

/** Active, unexpired promo code: its percentage off, or null. */
export async function promoPct(code: string, q: Tx | typeof db = db): Promise<number | null> {
  const c = code.trim().toUpperCase();
  if (!c) return null;
  const [r] = await q
    .select({ pct: schema.promoCodes.pct })
    .from(schema.promoCodes)
    .where(and(
      eq(schema.promoCodes.code, c),
      eq(schema.promoCodes.active, true),
      or(isNull(schema.promoCodes.expiresAt), gt(schema.promoCodes.expiresAt, new Date())),
    ))
    .limit(1);
  return r ? r.pct : null;
}

/**
 * Places an order in one transaction. Prices, stock, promo, delivery fee and credit all come from
 * the database; the input only says what to buy and where to send it.
 * dealer: the signed-in dealer (getDealer()), or null for a retail order.
 */
export async function placeOrder(input: OrderInput, dealer: DealerRow | null): Promise<PlaceResult> {
  const mode = dealer ? "dealer" : "retail";
  const speed = dealer ? "truck" : input.speed;

  if (dealer && input.pay !== "credit" && input.pay !== "bank")
    return { ok: false, error: "Dealer orders are paid on credit or by bank transfer", field: "pay" };
  if (!dealer && input.pay === "credit") return { ok: false, error: "Credit is only for dealer accounts", field: "pay" };
  if (speed === "exp" && !nextDayCity(input.city))
    return { ok: false, error: "Next day delivery is only for Gujranwala and Lahore", field: "speed" };

  try {
    return await db.transaction(async (tx) => {
      // Products, fresh and locked until the stock is written back.
      const ids = [...new Set(input.lines.map((l) => l.id))].sort();
      const rows = await tx.select().from(schema.products).where(inArray(schema.products.id, ids)).orderBy(asc(schema.products.id)).for("update");
      const by: ById = {};
      for (const r of rows) if (r.active) by[r.id] = toProduct(r);

      const lines: CartLine[] = [];
      const want = new Map<string, number>();
      for (const l of input.lines) {
        const p: Product | undefined = by[l.id];
        if (!p) refuse({ error: "unavailable", sku: l.id });
        const fin = l.fin as CartLine["fin"];
        if (p.fins.length ? !p.fins.includes(fin as never) : fin !== "") refuse({ error: "unavailable", sku: l.id });
        if (dealer && l.qty % p.carton) refuse({ error: "Dealer orders are in whole cartons", sku: l.id });
        lines.push({ id: l.id, fin, qty: l.qty });
        want.set(l.id, (want.get(l.id) ?? 0) + l.qty);
      }
      for (const [id, qty] of want) {
        const left = by[id].stock ?? 0;
        if (qty > left) refuse({ error: "stock", sku: id, left: Math.max(0, left) });
      }

      const [rate] = await tx.select().from(schema.shipRates).where(eq(schema.shipRates.city, input.city)).limit(1);
      if (!rate) refuse({ error: "Choose a city from the list", field: "city" });
      const rates: ShipRates = { [rate.city]: { d: rate.days, f: rate.fee, free: rate.freeOver } };

      const code = input.promo.trim().toUpperCase();
      const pct = code ? await promoPct(code, tx) : 0;
      if (pct === null) refuse({ error: "This code is not valid", field: "promo" });

      const q = quote(lines, by, mode, { rates, city: rate.city, speed, pct: pct ?? 0 });
      if (input.seen !== undefined && input.seen !== q.total) refuse({ error: "Prices have changed. Please check your order again." });

      if (dealer && input.pay === "credit") {
        // Lock the dealer so two orders cannot both spend the same credit.
        const [d] = await tx.select().from(schema.dealers).where(eq(schema.dealers.id, dealer.id)).for("update");
        const avail = (d?.creditLimit ?? 0) - (await ledgerBalance(tx, dealer.id));
        if (q.total > avail) refuse({ error: "This order is more than your available credit", field: "pay" });
      }

      for (const [id, qty] of want)
        await tx.update(schema.products).set({ stock: sql`${schema.products.stock} - ${qty}` }).where(eq(schema.products.id, id));

      const values = {
        kind: mode,
        dealerId: dealer?.id ?? null,
        lang: input.lang,
        name: input.name.trim(),
        phone: phoneDigits(input.phone),
        email: input.email.trim() || null,
        city: rate.city,
        area: input.area.trim(),
        addr: input.addr.trim(),
        mark: input.mark.trim() || null,
        speed,
        pay: input.pay,
        promo: code || null,
        subtotal: q.sub,
        discount: q.disc,
        fee: q.fee,
        total: q.total,
        cartons: dealer ? lines.reduce((a, l) => a + l.qty / by[l.id].carton, 0) : 0,
      } satisfies Omit<typeof schema.orders.$inferInsert, "no">;

      // "AB-" + 6 random digits; a clash rolls back to the savepoint and tries another number.
      let order: { id: number; no: string } | undefined;
      for (let i = 0; i < 10 && !order; i++) {
        const no = "AB-" + String(randomInt(0, 1_000_000)).padStart(6, "0");
        try {
          order = await tx.transaction(async (sp) => (await sp.insert(schema.orders).values({ ...values, no }).returning({ id: schema.orders.id, no: schema.orders.no }))[0]);
        } catch (e) {
          if (!isUniqueClash(e)) throw e;
        }
      }
      if (!order) throw new Error("Could not pick a free order number");

      await tx.insert(schema.orderItems).values(q.lines.map((l) => ({
        orderId: order.id,
        sku: l.id,
        name: by[l.id].name,
        fin: l.fin,
        qty: l.qty,
        unitPrice: l.unit,
        lineTotal: l.total,
      })));
      await tx.insert(schema.orderEvents).values({ orderId: order.id, status: "confirmed", by: dealer ? "dealer" : "web" });

      if (dealer && input.pay === "credit")
        await tx.insert(schema.ledger).values({ dealerId: dealer.id, day: todayPk(), ref: order.no, detail: "Order on credit", debit: q.total });

      return {
        ok: true as const,
        no: order.no,
        total: q.total,
        name: values.name,
        phone: input.phone.trim(),
        pay: input.pay,
        eta: etaDate(speed === "exp" ? 1 : rate.days).toISOString(),
      };
    });
  } catch (e) {
    if (e instanceof Refused) return e.result;
    throw e;
  }
}

/** Order status and timeline, only when the number and the mobile number both match. */
export async function findOrder(no: string, phone: string): Promise<TrackResult | null> {
  const [o] = await db
    .select({ id: schema.orders.id, no: schema.orders.no, status: schema.orders.status, total: schema.orders.total, created: schema.orders.createdAt })
    .from(schema.orders)
    .where(and(
      eq(schema.orders.no, normOrderNo(no)),
      sql`regexp_replace(${schema.orders.phone}, '[^0-9]', '', 'g') = ${phoneDigits(phone)}`,
    ))
    .limit(1);
  if (!o) return null;
  const [[n], events] = await Promise.all([
    db.select({ pcs: sql<string>`coalesce(sum(${schema.orderItems.qty}), 0)::bigint` }).from(schema.orderItems).where(eq(schema.orderItems.orderId, o.id)),
    db.select({ status: schema.orderEvents.status, at: schema.orderEvents.at }).from(schema.orderEvents).where(eq(schema.orderEvents.orderId, o.id)).orderBy(asc(schema.orderEvents.at), asc(schema.orderEvents.id)),
  ]);
  return {
    ok: true,
    no: o.no,
    status: o.status as OrderStatus,
    pcs: Number(n?.pcs ?? 0),
    total: o.total,
    created: o.created.toISOString(),
    events: events.map((e) => ({ status: e.status as OrderStatus, at: e.at.toISOString() })),
  };
}

/** Adds a newsletter subscriber; an address already on the list is left as it is. */
export async function addSubscriber(email: string, lang: string) {
  await db.insert(schema.subscribers).values({ email: email.trim().toLowerCase(), lang }).onConflictDoNothing({ target: schema.subscribers.email });
}
