"use server";

import { refresh, updateTag } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { TAG } from "@/lib/store";
import { listImages } from "@/lib/admin-data";
import { productSchema, stockSchema, type ActionResult } from "./schemas";
import { firstIssue, isUnique, staffOrError } from "./guard";

const { products } = schema;

const lines = (s: string) => s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const orNull = (s: string) => (s ? s : null);

/** Creates (mode "create") or updates a product. The SKU cannot change on edit. */
export async function saveProduct(mode: "create" | "edit", input: unknown): Promise<ActionResult> {
  const { err } = await staffOrError();
  if (err) return err;
  if (mode !== "create" && mode !== "edit") return { ok: false, error: "Bad request." };
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const v = parsed.data;

  const images = new Set(await listImages());
  for (const [label, file] of [["Photo", v.img], ["Hover photo", v.alt], ["Room photo", v.cimg]] as const) {
    if (file && !images.has(file)) return { ok: false, error: `${label}: pick a file from public/img.` };
  }
  const specsUr = lines(v.specsUr);
  const row = {
    name: v.name, nameUr: orNull(v.nameUr), cat: v.cat, sub: orNull(v.sub), subUr: orNull(v.subUr),
    price: v.price, was: v.was, carton: v.carton, slabs: [...v.slabs], flag: orNull(v.flag), sale: v.sale,
    fins: [...new Set(v.fins)], specs: lines(v.specs), specsUr: specsUr.length ? specsUr : null,
    pt: orNull(v.pt), pack: orNull(v.pack), wty: orNull(v.wty), tags: orNull(v.tags),
    img: orNull(v.img), alt: orNull(v.alt), cimg: orNull(v.cimg), pos: orNull(v.pos), crop: orNull(v.crop),
    stock: v.stock, active: v.active, sort: v.sort, updatedAt: new Date(),
  };

  if (mode === "create") {
    try {
      await db.insert(products).values({ id: v.id, ...row });
    } catch (e) {
      if (isUnique(e)) return { ok: false, error: `SKU ${v.id} already exists.` };
      throw e;
    }
  } else {
    const done = await db.update(products).set(row).where(eq(products.id, v.id)).returning({ id: products.id });
    if (!done.length) return { ok: false, error: "Product not found." };
  }
  updateTag(TAG.catalog);
  refresh();
  return { ok: true, msg: mode === "create" ? `${v.id} added.` : `${v.id} saved.`, id: v.id };
}

/** Adds or removes pieces from stock (never below 0). */
export async function adjustStock(input: unknown): Promise<ActionResult> {
  const { err } = await staffOrError();
  if (err) return err;
  const parsed = stockSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const { id, delta } = parsed.data;
  const done = await db
    .update(products)
    .set({ stock: sql`greatest(${products.stock} + ${delta}, 0)`, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning({ stock: products.stock });
  if (!done.length) return { ok: false, error: "Product not found." };
  updateTag(TAG.catalog);
  refresh();
  return { ok: true, msg: `Stock is now ${done[0].stock.toLocaleString("en-PK")} pcs.` };
}

/** Shows or hides a product in the shop. */
export async function setProductActive(id: string, active: boolean): Promise<ActionResult> {
  const { err } = await staffOrError();
  if (err) return err;
  const parsed = z.object({ id: z.string().min(1).max(20), active: z.boolean() }).safeParse({ id, active });
  if (!parsed.success) return firstIssue(parsed.error);
  await db.update(products).set({ active: parsed.data.active, updatedAt: new Date() }).where(eq(products.id, parsed.data.id));
  updateTag(TAG.catalog);
  refresh();
  return { ok: true };
}
