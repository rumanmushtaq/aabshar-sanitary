"use server";

import { refresh, updateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { TAG } from "@/lib/store";
import { idSchema, promoSchema, shipRateSchema, shopSchema, type ActionResult } from "./schemas";
import { firstIssue, isUnique, staffOrError } from "./guard";

const { shipRates, shops, promoCodes } = schema;
const cityName = z.string().trim().min(1).max(60);

/* ---------- delivery rates ---------- */

/** Adds a city (mode "create") or updates its days and fee. */
export async function saveShipRate(mode: "create" | "edit", input: unknown): Promise<ActionResult> {
  const { err } = await staffOrError("admin");
  if (err) return err;
  const parsed = shipRateSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const { city, ...v } = parsed.data;
  if (mode === "create") {
    try {
      await db.insert(shipRates).values({ city, ...v });
    } catch (e) {
      if (isUnique(e)) return { ok: false, error: `${city} already has a rate. Edit it in the list.` };
      throw e;
    }
  } else {
    const done = await db.update(shipRates).set(v).where(eq(shipRates.city, city)).returning({ city: shipRates.city });
    if (!done.length) return { ok: false, error: "City not found." };
  }
  updateTag(TAG.ship);
  refresh();
  return { ok: true, msg: `${city} saved.` };
}

export async function deleteShipRate(city: string): Promise<ActionResult> {
  const { err } = await staffOrError("admin");
  if (err) return err;
  const parsed = cityName.safeParse(city);
  if (!parsed.success) return firstIssue(parsed.error);
  await db.delete(shipRates).where(eq(shipRates.city, parsed.data));
  updateTag(TAG.ship);
  refresh();
  return { ok: true };
}

/* ---------- dealer shops ("Find a dealer") ---------- */

export async function saveShop(input: unknown): Promise<ActionResult> {
  const { err } = await staffOrError("admin");
  if (err) return err;
  const parsed = shopSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const { id, ...v } = parsed.data;
  if (id) {
    const done = await db.update(shops).set(v).where(eq(shops.id, id)).returning({ id: shops.id });
    if (!done.length) return { ok: false, error: "Shop not found." };
  } else {
    await db.insert(shops).values(v);
  }
  updateTag(TAG.shops);
  refresh();
  return { ok: true, msg: `${v.name} saved.` };
}

export async function deleteShop(id: number): Promise<ActionResult> {
  const { err } = await staffOrError("admin");
  if (err) return err;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return firstIssue(parsed.error);
  await db.delete(shops).where(eq(shops.id, parsed.data));
  updateTag(TAG.shops);
  refresh();
  return { ok: true };
}

/* ---------- promo codes ---------- */

export async function savePromo(mode: "create" | "edit", input: unknown): Promise<ActionResult> {
  const { err } = await staffOrError("admin");
  if (err) return err;
  const parsed = promoSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const { code, pct, active, expires } = parsed.data;
  // The code is valid to the end of the expiry day, Pakistan time.
  const expiresAt = expires ? new Date(`${expires}T23:59:59+05:00`) : null;
  if (mode === "create") {
    try {
      await db.insert(promoCodes).values({ code, pct, active, expiresAt });
    } catch (e) {
      if (isUnique(e)) return { ok: false, error: `${code} already exists.` };
      throw e;
    }
  } else {
    const done = await db.update(promoCodes).set({ pct, active, expiresAt }).where(eq(promoCodes.code, code)).returning({ code: promoCodes.code });
    if (!done.length) return { ok: false, error: "Code not found." };
  }
  refresh();
  return { ok: true, msg: `${code} saved.` };
}

export async function deletePromo(code: string): Promise<ActionResult> {
  const { err } = await staffOrError("admin");
  if (err) return err;
  const parsed = z.string().max(20).safeParse(code);
  if (!parsed.success) return firstIssue(parsed.error);
  await db.delete(promoCodes).where(eq(promoCodes.code, parsed.data));
  refresh();
  return { ok: true };
}
