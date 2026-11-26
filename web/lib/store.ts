import "server-only";
import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, schema } from "./db";
import type { FinishId, Product } from "./data";

/** Cache tags. Admin actions call updateTag() with these after a change. */
export const TAG = { catalog: "catalog", ship: "ship", shops: "shops" } as const;

export type ShipRates = Record<string, { d: number; f: number; free: boolean }>;
export type Shops = Record<string, { n: number; list: [string, string, string][] }>;

const orUndef = <T,>(v: T | null) => (v === null ? undefined : v);

export function toProduct(r: typeof schema.products.$inferSelect): Product {
  return {
    id: r.id, name: r.name, cat: r.cat,
    img: orUndef(r.img), alt: orUndef(r.alt), pos: orUndef(r.pos), crop: orUndef(r.crop), cimg: orUndef(r.cimg),
    price: r.price, was: r.was, carton: r.carton, slabs: [r.slabs[0], r.slabs[1], r.slabs[2]],
    flag: orUndef(r.flag), sale: r.sale || undefined, fins: r.fins as FinishId[], specs: r.specs,
    pt: orUndef(r.pt) as Product["pt"], pack: orUndef(r.pack) as Product["pack"],
    sub: orUndef(r.sub), wty: orUndef(r.wty), tags: orUndef(r.tags), stock: r.stock,
    nameUr: orUndef(r.nameUr), subUr: orUndef(r.subUr), specsUr: orUndef(r.specsUr),
  };
}

/** Active products in display order. */
export async function getCatalog(): Promise<Product[]> {
  "use cache";
  cacheTag(TAG.catalog);
  cacheLife("max");
  const rows = await db.select().from(schema.products).where(eq(schema.products.active, true)).orderBy(asc(schema.products.sort), asc(schema.products.id));
  return rows.map(toProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  return (await getCatalog()).find((p) => p.id === id) ?? null;
}

/** Delivery days and fee by city. */
export async function getShipRates(): Promise<ShipRates> {
  "use cache";
  cacheTag(TAG.ship);
  cacheLife("max");
  const rows = await db.select().from(schema.shipRates).orderBy(asc(schema.shipRates.days), asc(schema.shipRates.city));
  return Object.fromEntries(rows.map((r) => [r.city, { d: r.days, f: r.fee, free: r.freeOver }]));
}

/** Dealer shops by city for "Find a dealer". */
export async function getShops(): Promise<Shops> {
  "use cache";
  cacheTag(TAG.shops);
  cacheLife("max");
  const rows = await db.select().from(schema.shops).orderBy(asc(schema.shops.city), asc(schema.shops.sort));
  const out: Shops = {};
  for (const r of rows) (out[r.city] ??= { n: 0, list: [] }).list.push([r.name, r.area, r.phone]);
  for (const c of Object.values(out)) c.n = c.list.length;
  return out;
}
