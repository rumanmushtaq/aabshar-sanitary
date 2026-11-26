import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { getDealer } from "./auth";
import { FIN, type FinishId } from "./data";
import type { DealerInfo, DealerOrder, ReorderLine } from "@/components/dealer/data";

/*
 * Dealer portal reads. Every exported function resolves the signed-in dealer itself and
 * only reads that dealer's rows; none takes a dealer id. Each returns null when signed out.
 */

const { ledger, orders, orderItems, products } = schema;
type Dealer = NonNullable<Awaited<ReturnType<typeof getDealer>>>;

/** The signed-in dealer, read once per request. */
const current = cache(getDealer);

/** Order status to the index into STAGES; cancelled is -1. */
const STAGE: Record<string, number> = { confirmed: 0, packed: 1, shipped: 2, delivered: 3, cancelled: -1 };

/** First moment of the current month in Pakistan time. */
const monthStart = sql`(date_trunc('month', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi')`;
const karachiDay = (col: typeof orders.createdAt) => sql<string>`to_char(${col} at time zone 'Asia/Karachi', 'YYYY-MM-DD')`;

const info = (d: Dealer): DealerInfo => ({
  name: d.name, initials: d.initials, city: d.city, tier: d.tier, since: d.since, manager: d.manager,
});

/** "2026-10-29" plus n days, as "YYYY-MM-DD". */
function addDays(day: string, n: number): string {
  const t = new Date(day + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

export type KhataRow = { day: string; ref: string; detail: string; debit: number; credit: number; balance: number };
export type Khata = {
  balance: number;
  limit: number;
  available: number;
  /** When the oldest unpaid debit falls due ("YYYY-MM-DD"), or null when nothing is owed. */
  due: string | null;
  /** Oldest first, with the balance after each entry. */
  rows: KhataRow[];
};

async function khataOf(d: Dealer): Promise<Khata> {
  const rows = await db
    .select({ day: ledger.day, ref: ledger.ref, detail: ledger.detail, debit: ledger.debit, credit: ledger.credit })
    .from(ledger)
    .where(eq(ledger.dealerId, d.id))
    .orderBy(asc(ledger.day), asc(ledger.id));

  let balance = 0;
  let credits = 0;
  const out = rows.map((r) => {
    balance += r.debit - r.credit;
    credits += r.credit;
    return { ...r, balance };
  });

  // Payments clear the oldest debits first; the first debit they don't fully cover sets the due date.
  let due: string | null = null;
  for (const r of rows) {
    if (!r.debit) continue;
    if (credits >= r.debit) {
      credits -= r.debit;
      continue;
    }
    due = addDays(r.day, d.termsDays);
    break;
  }
  return { balance, limit: d.creditLimit, available: d.creditLimit - balance, due, rows: out };
}

async function ordersOf(d: Dealer, limit?: number): Promise<DealerOrder[]> {
  const q = db
    .select({
      no: orders.no,
      day: karachiDay(orders.createdAt),
      items: sql<number>`(select count(*) from ${orderItems} where ${orderItems.orderId} = ${orders.id})`.mapWith(Number),
      cartons: orders.cartons,
      total: orders.total,
      status: orders.status,
    })
    .from(orders)
    .where(eq(orders.dealerId, d.id))
    .orderBy(desc(orders.createdAt), desc(orders.id));
  const rows = limit ? await q.limit(limit) : await q;
  return rows.map(({ status, ...o }) => ({ ...o, stage: STAGE[status] ?? 0 }));
}

/** Non-cancelled orders placed this month (Pakistan time): their total, and the saving against today's retail prices. */
async function monthOf(d: Dealer) {
  const inMonth = and(eq(orders.dealerId, d.id), ne(orders.status, "cancelled"), sql`${orders.createdAt} >= ${monthStart}`);
  const [[sum], lines] = await Promise.all([
    db.select({ total: sql<number>`coalesce(sum(${orders.total}), 0)`.mapWith(Number) }).from(orders).where(inMonth),
    db
      .select({ fin: orderItems.fin, qty: orderItems.qty, lineTotal: orderItems.lineTotal, price: products.price })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(products.id, orderItems.sku))
      .where(inMonth),
  ]);
  let saved = 0;
  for (const l of lines) {
    if (l.price == null) continue; // product deleted: no retail price to compare with
    const mult = FIN[l.fin as FinishId]?.mult ?? 1;
    saved += l.price * mult * l.qty - l.lineTotal;
  }
  return { bought: sum?.total ?? 0, saved: Math.max(0, Math.round(saved)) };
}

/** Lines of the latest non-cancelled order. */
async function lastOrderOf(d: Dealer): Promise<{ no: string; lines: (ReorderLine & { name: string })[] } | null> {
  const [last] = await db
    .select({ id: orders.id, no: orders.no })
    .from(orders)
    .where(and(eq(orders.dealerId, d.id), ne(orders.status, "cancelled")))
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(1);
  if (!last) return null;
  const lines = await db
    .select({ id: orderItems.sku, name: orderItems.name, fin: orderItems.fin, qty: orderItems.qty })
    .from(orderItems)
    .where(eq(orderItems.orderId, last.id))
    .orderBy(asc(orderItems.id));
  return { no: last.no, lines };
}

/* ---------- for pages and route handlers ---------- */

/** Name, city and tier for the portal header. */
export async function getDealerInfo(): Promise<DealerInfo | null> {
  const d = await current();
  return d ? info(d) : null;
}

export async function getOverview() {
  const d = await current();
  if (!d) return null;
  const [khata, month, recent, last] = await Promise.all([khataOf(d), monthOf(d), ordersOf(d, 3), lastOrderOf(d)]);
  const { balance, limit, available, due } = khata;
  return { dealer: info(d), balance, limit, available, due, ...month, recent, last };
}

export async function getKhata(): Promise<Khata | null> {
  const d = await current();
  return d ? khataOf(d) : null;
}

export async function getOrders(): Promise<DealerOrder[] | null> {
  const d = await current();
  return d ? ordersOf(d) : null;
}

/* ---------- CSV downloads ---------- */

/** CSV with a BOM so Excel reads Urdu. Text that a spreadsheet would run as a formula gets a leading quote. */
export function toCsv(rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    if (typeof v === "number") return String(v);
    const s = /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

export function csvResponse(body: string, filename: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
