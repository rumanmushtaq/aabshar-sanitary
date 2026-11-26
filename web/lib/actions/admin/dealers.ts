"use server";

import { refresh } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { hashSecret } from "@/lib/auth";
import { dealerCreateSchema, dealerEditSchema, idSchema, paymentSchema, pinSchema, type ActionResult } from "./schemas";
import { firstIssue, isUnique, staffOrError, todayPK } from "./guard";

const { dealers, ledger, sessions } = schema;
const PHONE_TAKEN: ActionResult = { ok: false, error: "Another dealer already uses this phone number." };

/** Admin only: a new dealer sets a credit limit. */
export async function createDealer(input: unknown): Promise<ActionResult> {
  const { err } = await staffOrError("admin");
  if (err) return err;
  const parsed = dealerCreateSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const { pin, ...v } = parsed.data;
  try {
    const [row] = await db.insert(dealers).values({ ...v, pinHash: await hashSecret(pin) }).returning({ id: dealers.id });
    refresh();
    return { ok: true, msg: `${v.name} added.`, id: row.id };
  } catch (e) {
    if (isUnique(e)) return PHONE_TAKEN;
    throw e;
  }
}

/** Staff may edit contact details; only an admin may change the credit limit and terms. */
export async function updateDealer(input: unknown): Promise<ActionResult> {
  const { me, err } = await staffOrError();
  if (err) return err;
  const parsed = dealerEditSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const { id, creditLimit, termsDays, ...v } = parsed.data;
  const [cur] = await db.select({ creditLimit: dealers.creditLimit, termsDays: dealers.termsDays }).from(dealers).where(eq(dealers.id, id)).limit(1);
  if (!cur) return { ok: false, error: "Dealer not found." };
  if (me.role !== "admin" && (cur.creditLimit !== creditLimit || cur.termsDays !== termsDays))
    return { ok: false, error: "Only an admin can change the credit limit or terms." };
  try {
    await db.update(dealers).set({ ...v, creditLimit, termsDays }).where(eq(dealers.id, id));
  } catch (e) {
    if (isUnique(e)) return PHONE_TAKEN;
    throw e;
  }
  refresh();
  return { ok: true, msg: "Dealer saved." };
}

/** Admin only. Deactivating also signs the dealer out. */
export async function setDealerActive(id: number, active: boolean): Promise<ActionResult> {
  const { err } = await staffOrError("admin");
  if (err) return err;
  const parsed = z.object({ id: idSchema, active: z.boolean() }).safeParse({ id, active });
  if (!parsed.success) return firstIssue(parsed.error);
  await db.update(dealers).set({ active: parsed.data.active }).where(eq(dealers.id, parsed.data.id));
  if (!parsed.data.active) await db.delete(sessions).where(eq(sessions.dealerId, parsed.data.id));
  refresh();
  return { ok: true, msg: parsed.data.active ? "Dealer reactivated." : "Dealer deactivated." };
}

/** Sets a new PIN and signs the dealer out of every device. */
export async function resetDealerPin(input: unknown): Promise<ActionResult> {
  const { err } = await staffOrError();
  if (err) return err;
  const parsed = pinSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const done = await db
    .update(dealers)
    .set({ pinHash: await hashSecret(parsed.data.pin) })
    .where(eq(dealers.id, parsed.data.id))
    .returning({ id: dealers.id });
  if (!done.length) return { ok: false, error: "Dealer not found." };
  await db.delete(sessions).where(eq(sessions.dealerId, parsed.data.id));
  return { ok: true, msg: "PIN changed. Tell the dealer the new PIN." };
}

/** A payment from the dealer: a credit on the khata. */
export async function recordPayment(input: unknown): Promise<ActionResult> {
  const { err } = await staffOrError();
  if (err) return err;
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const v = parsed.data;
  if (v.day > todayPK()) return { ok: false, error: "The payment date cannot be in the future." };
  const [d] = await db.select({ id: dealers.id }).from(dealers).where(eq(dealers.id, v.dealerId)).limit(1);
  if (!d) return { ok: false, error: "Dealer not found." };
  const detail = [v.method === "Bank" ? "Bank transfer" : v.method, v.note].filter(Boolean).join(", ");
  await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(ledger)
      .values({ dealerId: v.dealerId, day: v.day, ref: v.ref || "PAY", detail, debit: 0, credit: v.amount })
      .returning({ id: ledger.id });
    if (!v.ref) await tx.update(ledger).set({ ref: `PAY-${String(row.id).padStart(4, "0")}` }).where(eq(ledger.id, row.id));
  });
  refresh();
  return { ok: true, msg: `Payment of Rs ${v.amount.toLocaleString("en-PK")} recorded.` };
}
