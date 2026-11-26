"use server";

import { refresh, updateTag } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { TAG } from "@/lib/store";
import { statusSchema, type ActionResult } from "./schemas";
import { firstIssue, staffOrError, todayPK } from "./guard";

const { orders, orderItems, orderEvents, products, ledger } = schema;

/**
 * Moves an order to a new status and logs it on the timeline with the staff name.
 * Cancelling puts the stock back and, for a dealer order on credit, credits the khata
 * with whatever is still owed on that order ("Order cancelled").
 */
export async function setOrderStatus(input: unknown): Promise<ActionResult> {
  const { me, err } = await staffOrError();
  if (err) return err;
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const { id, status, note } = parsed.data;

  const result = await db.transaction(async (tx): Promise<ActionResult> => {
    const [o] = await tx.select().from(orders).where(eq(orders.id, id)).for("update").limit(1);
    if (!o) return { ok: false, error: "Order not found." };
    if (o.status === status) return { ok: false, error: `The order is already ${status}.` };
    if (o.status === "cancelled") return { ok: false, error: "A cancelled order cannot be reopened. Place a new order instead." };
    if (status === "cancelled" && o.status === "delivered")
      return { ok: false, error: "A delivered order cannot be cancelled here. Record a return or claim on the khata instead." };

    await tx.update(orders).set({ status }).where(eq(orders.id, id));
    await tx.insert(orderEvents).values({ orderId: id, status, note: note || null, by: me.name });

    if (status === "cancelled") {
      const items = await tx.select({ sku: orderItems.sku, qty: orderItems.qty }).from(orderItems).where(eq(orderItems.orderId, id));
      for (const it of items) {
        await tx.update(products).set({ stock: sql`${products.stock} + ${it.qty}`, updatedAt: new Date() }).where(eq(products.id, it.sku));
      }
      if (o.kind === "dealer" && o.pay === "credit" && o.dealerId) {
        const [{ owed }] = await tx
          .select({ owed: sql<number>`coalesce(sum(${ledger.debit}), 0) - coalesce(sum(${ledger.credit}), 0)`.mapWith(Number) })
          .from(ledger)
          .where(and(eq(ledger.dealerId, o.dealerId), eq(ledger.ref, o.no)));
        if (owed > 0) {
          await tx.insert(ledger).values({ dealerId: o.dealerId, day: todayPK(), ref: o.no, detail: "Order cancelled", debit: 0, credit: owed });
        }
      }
    }
    return { ok: true, msg: `Order ${o.no} is now ${status}.` };
  });

  if (result.ok) {
    if (status === "cancelled") updateTag(TAG.catalog); // stock changed
    refresh();
  }
  return result;
}
