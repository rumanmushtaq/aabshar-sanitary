import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { and, asc, count, desc, eq, ilike, inArray, lt, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getAdmin } from "@/lib/auth";

const { orders, orderItems, orderEvents, products, dealers, ledger, shipRates, shops, promoCodes, subscribers, users } = schema;

export const PAGE_SIZE = 25;

/* ---------- session ---------- */

/** For pages: the signed-in staff user, or a redirect to the login page. */
export async function requireStaff() {
  const me = await getAdmin();
  if (!me) redirect("/admin/login");
  return me;
}

/* ---------- dashboard ---------- */

const PK_TODAY = sql`(date_trunc('day', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi')`;
const PK_WEEK = sql`((date_trunc('day', now() at time zone 'Asia/Karachi') - interval '6 days') at time zone 'Asia/Karachi')`;

/** Per-dealer balance subquery: sum(debit) - sum(credit). */
const balances = db
  .select({
    dealerId: ledger.dealerId,
    balance: sql<number>`coalesce(sum(${ledger.debit}), 0) - coalesce(sum(${ledger.credit}), 0)`.mapWith(Number).as("balance"),
  })
  .from(ledger)
  .groupBy(ledger.dealerId)
  .as("bal");

export async function getDashboard() {
  const live = sql`${orders.status} <> 'cancelled'`;
  const [[o], [debt], low, recent] = await Promise.all([
    db
      .select({
        todayN: sql<number>`count(*) filter (where ${orders.createdAt} >= ${PK_TODAY} and ${live})`.mapWith(Number),
        todayRs: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.createdAt} >= ${PK_TODAY} and ${live}), 0)`.mapWith(Number),
        weekN: sql<number>`count(*) filter (where ${orders.createdAt} >= ${PK_WEEK} and ${live})`.mapWith(Number),
        weekRs: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.createdAt} >= ${PK_WEEK} and ${live}), 0)`.mapWith(Number),
        waiting: sql<number>`count(*) filter (where ${orders.status} in ('confirmed', 'packed'))`.mapWith(Number),
      })
      .from(orders),
    db
      .select({ total: sql<number>`coalesce(sum(greatest(${balances.balance}, 0)), 0)`.mapWith(Number) })
      .from(balances),
    db
      .select({ id: products.id, name: products.name, stock: products.stock, carton: products.carton })
      .from(products)
      .where(and(eq(products.active, true), lt(products.stock, sql`2 * ${products.carton}`)))
      .orderBy(asc(sql`${products.stock}::float / ${products.carton}`))
      .limit(20),
    listOrders({ page: 1, size: 8 }),
  ]);
  return { ...o, outstanding: debt.total, low, recent: recent.rows };
}

/* ---------- orders ---------- */

export type OrderFilter = { status?: string; kind?: string; q?: string; page?: number; size?: number };

export async function listOrders(f: OrderFilter) {
  const where: SQL[] = [];
  if (f.status === "waiting") where.push(inArray(orders.status, ["confirmed", "packed"]));
  else if (f.status && ["confirmed", "packed", "shipped", "delivered", "cancelled"].includes(f.status))
    where.push(eq(orders.status, f.status as "confirmed"));
  if (f.kind === "retail" || f.kind === "dealer") where.push(eq(orders.kind, f.kind));
  const q = f.q?.trim();
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
    const digits = q.replace(/\D/g, "");
    const conds = [ilike(orders.no, like), ilike(orders.name, like)];
    if (digits.length >= 3) conds.push(ilike(orders.phone, `%${digits}%`));
    where.push(or(...conds)!);
  }
  const cond = where.length ? and(...where) : undefined;
  const size = f.size ?? PAGE_SIZE;
  const page = Math.max(1, f.page ?? 1);
  const [rows, [{ n }]] = await Promise.all([
    db
      .select({
        id: orders.id, no: orders.no, kind: orders.kind, status: orders.status, name: orders.name, phone: orders.phone,
        city: orders.city, pay: orders.pay, total: orders.total, cartons: orders.cartons, createdAt: orders.createdAt,
        // Raw, fully qualified names: drizzle prints columns unqualified inside sql``, which a subquery would misread.
        items: sql<number>`(select count(*) from order_items oi where oi.order_id = "orders"."id")`.mapWith(Number),
      })
      .from(orders)
      .where(cond)
      .orderBy(desc(orders.createdAt), desc(orders.id))
      .limit(size)
      .offset((page - 1) * size),
    db.select({ n: count() }).from(orders).where(cond),
  ]);
  return { rows, total: n, page, pages: Math.max(1, Math.ceil(n / size)) };
}

export async function getOrder(id: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const [items, events, dealer] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(asc(orderItems.id)),
    db.select().from(orderEvents).where(eq(orderEvents.orderId, id)).orderBy(asc(orderEvents.at), asc(orderEvents.id)),
    order.dealerId
      ? db.select({ id: dealers.id, name: dealers.name, city: dealers.city }).from(dealers).where(eq(dealers.id, order.dealerId)).then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);
  return { order, items, events, dealer };
}

/* ---------- products ---------- */

export type ProductFilter = { q?: string; cat?: string; state?: string; stock?: string };

export async function listProducts(f: ProductFilter) {
  const where: SQL[] = [];
  const q = f.q?.trim();
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
    where.push(or(ilike(products.id, like), ilike(products.name, like), ilike(products.tags, like))!);
  }
  if (f.cat) where.push(eq(products.cat, f.cat));
  if (f.state === "active") where.push(eq(products.active, true));
  if (f.state === "inactive") where.push(eq(products.active, false));
  if (f.stock === "low") where.push(lt(products.stock, sql`2 * ${products.carton}`));
  if (f.stock === "out") where.push(lt(products.stock, 1));
  return db
    .select({
      id: products.id, name: products.name, cat: products.cat, img: products.img, cimg: products.cimg, price: products.price,
      carton: products.carton, stock: products.stock, active: products.active, sort: products.sort,
    })
    .from(products)
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(products.sort), asc(products.id));
}

export async function listCategories(): Promise<string[]> {
  const rows = await db.selectDistinct({ cat: products.cat }).from(products).orderBy(asc(products.cat));
  return rows.map((r) => r.cat);
}

export async function getProductRow(id: string) {
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return row ?? null;
}

/** Image files in public/img, as "/img/name.jpg". */
export async function listImages(): Promise<string[]> {
  try {
    const files = await readdir(path.join(process.cwd(), "public", "img"));
    return files.filter((f) => /\.(jpe?g|png|webp|avif|svg)$/i.test(f)).sort().map((f) => `/img/${f}`);
  } catch {
    return [];
  }
}

/* ---------- dealers ---------- */

export async function listDealers() {
  return db
    .select({
      id: dealers.id, name: dealers.name, initials: dealers.initials, city: dealers.city, phone: dealers.phone, tier: dealers.tier,
      creditLimit: dealers.creditLimit, termsDays: dealers.termsDays, active: dealers.active,
      balance: sql<number>`coalesce(${balances.balance}, 0)`.mapWith(Number),
      lastOrder: sql<Date | null>`(select max(o2.created_at) from orders o2 where o2.dealer_id = "dealers"."id")`.mapWith(
        (v: string | Date | null) => (v ? new Date(v) : null),
      ),
    })
    .from(dealers)
    .leftJoin(balances, eq(balances.dealerId, dealers.id))
    .orderBy(desc(dealers.active), asc(dealers.name));
}

export async function getDealerFull(id: number) {
  const [dealer] = await db
    .select({
      id: dealers.id, name: dealers.name, initials: dealers.initials, city: dealers.city, phone: dealers.phone, tier: dealers.tier,
      since: dealers.since, creditLimit: dealers.creditLimit, termsDays: dealers.termsDays, manager: dealers.manager,
      active: dealers.active, createdAt: dealers.createdAt,
    })
    .from(dealers)
    .where(eq(dealers.id, id))
    .limit(1);
  if (!dealer) return null;
  const [rows, recent] = await Promise.all([
    db.select().from(ledger).where(eq(ledger.dealerId, id)).orderBy(asc(ledger.day), asc(ledger.id)),
    db
      .select({ id: orders.id, no: orders.no, status: orders.status, total: orders.total, createdAt: orders.createdAt })
      .from(orders)
      .where(eq(orders.dealerId, id))
      .orderBy(desc(orders.createdAt))
      .limit(10),
  ]);
  let run = 0;
  const entries = rows.map((r) => {
    run += r.debit - r.credit;
    return { id: r.id, day: r.day, ref: r.ref, detail: r.detail, debit: r.debit, credit: r.credit, balance: run };
  });
  return { dealer, entries, balance: run, recent };
}

/* ---------- settings ---------- */

export async function getSettings() {
  const [rates, shopRows, promos] = await Promise.all([
    db.select().from(shipRates).orderBy(asc(shipRates.days), asc(shipRates.city)),
    db.select().from(shops).orderBy(asc(shops.city), asc(shops.sort), asc(shops.id)),
    db.select().from(promoCodes).orderBy(desc(promoCodes.active), asc(promoCodes.code)),
  ]);
  return { rates, shops: shopRows, promos };
}

/* ---------- subscribers & staff ---------- */

export async function listSubscribers(page: number, size = 50) {
  const p = Math.max(1, page);
  const [rows, [{ n }]] = await Promise.all([
    db.select().from(subscribers).orderBy(desc(subscribers.createdAt), desc(subscribers.id)).limit(size).offset((p - 1) * size),
    db.select({ n: count() }).from(subscribers),
  ]);
  return { rows, total: n, page: p, pages: Math.max(1, Math.ceil(n / size)) };
}

export async function allSubscribers() {
  return db.select().from(subscribers).orderBy(asc(subscribers.createdAt), asc(subscribers.id));
}

export async function listUsers() {
  return db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, active: users.active, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.active), asc(users.name));
}
