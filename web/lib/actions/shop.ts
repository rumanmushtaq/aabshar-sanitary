"use server";

import { updateTag } from "next/cache";
import { getDealer } from "@/lib/auth";
import { TAG } from "@/lib/store";
import { addSubscriber, findOrder, placeOrder as place, promoPct } from "@/lib/orders";
import {
  CONTACT_FIELDS,
  orderSchema,
  subscribeSchema,
  trackSchema,
  type ContactField,
  type PlaceResult,
  type TrackResult,
} from "@/lib/checkout-schema";

const OOPS = "Something went wrong. Please try again.";

/** Places an order from cart lines and the checkout form. Prices and mode are decided here, never by the browser. */
export async function placeOrder(input: unknown): Promise<PlaceResult> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = CONTACT_FIELDS.find((f) => f === issue?.path[0]) as ContactField | undefined;
    return field
      ? { ok: false, error: issue.message, field }
      : { ok: false, error: "Something in your cart has changed. Please check it again." };
  }
  try {
    const res = await place(parsed.data, await getDealer());
    if (res.ok) updateTag(TAG.catalog); // stock changed
    return res;
  } catch (e) {
    console.error("[placeOrder]", e);
    return { ok: false, error: OOPS };
  }
}

/** Checks a promo code for the checkout summary. placeOrder checks it again. */
export async function checkPromo(code: unknown): Promise<{ ok: true; pct: number } | { ok: false }> {
  if (typeof code !== "string" || code.length > 40) return { ok: false };
  try {
    const pct = await promoPct(code);
    return pct === null ? { ok: false } : { ok: true, pct };
  } catch (e) {
    console.error("[checkPromo]", e);
    return { ok: false };
  }
}

/** Order status for the tracking page. Number and mobile must both match; any miss gets the same answer. */
export async function trackOrder(input: unknown): Promise<TrackResult> {
  const miss = { ok: false as const, error: "We could not find an order with this number and mobile number." };
  const parsed = trackSchema.safeParse(input);
  if (!parsed.success) return miss;
  try {
    return (await findOrder(parsed.data.no, parsed.data.phone)) ?? miss;
  } catch (e) {
    console.error("[trackOrder]", e);
    return { ok: false, error: OOPS };
  }
}

/** Newsletter sign-up. An address already on the list counts as success. */
export async function subscribe(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check this email address" };
  try {
    await addSubscriber(parsed.data.email, parsed.data.lang);
    return { ok: true };
  } catch (e) {
    console.error("[subscribe]", e);
    return { ok: false, error: OOPS };
  }
}
