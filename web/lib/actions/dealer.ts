"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db, schema } from "@/lib/db";
import { endDealerSession, hashSecret, startDealerSession, verifySecret } from "@/lib/auth";
import { normalisePhone, signInSchema } from "@/components/dealer/data";

type Result = { ok: true } | { ok: false; error: string };

const WRONG = "Mobile number or PIN is wrong";
const LOCKED = "Too many tries. Wait 15 minutes and try again.";

/* Failed PIN tries per mobile number, kept in this server process. A 4-digit PIN needs this. */
const MAX_TRIES = 8;
const WINDOW_MS = 15 * 60_000;
const tries = new Map<string, { n: number; since: number }>();

function locked(phone: string) {
  const t = tries.get(phone);
  if (t && Date.now() - t.since > WINDOW_MS) tries.delete(phone);
  return (tries.get(phone)?.n ?? 0) >= MAX_TRIES;
}

function failed(phone: string) {
  const t = tries.get(phone);
  tries.set(phone, t ? { n: t.n + 1, since: t.since } : { n: 1, since: Date.now() });
  if (tries.size > 10_000) tries.clear(); // never grow without bound
}

/** Compared against when the mobile number is unknown, so both answers take as long. */
let dummyHash: Promise<string> | undefined;

async function activeDealerByPhone(phone: string) {
  const [d] = await db
    .select({ id: schema.dealers.id, pinHash: schema.dealers.pinHash })
    .from(schema.dealers)
    .where(and(eq(schema.dealers.phone, phone), eq(schema.dealers.active, true)))
    .limit(1);
  return d ?? null;
}

/** Signs a dealer in with mobile number and PIN. */
export async function signIn(input: { phone: string; pin: string }): Promise<Result> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: WRONG };
  const phone = normalisePhone(parsed.data.phone);
  if (locked(phone)) return { ok: false, error: LOCKED };

  const d = await activeDealerByPhone(phone);
  const ok = d
    ? await verifySecret(parsed.data.pin, d.pinHash)
    : await verifySecret(parsed.data.pin, await (dummyHash ??= hashSecret("0000"))).then(() => false);
  if (!d || !ok) {
    failed(phone);
    return { ok: false, error: WRONG };
  }
  tries.delete(phone);
  await startDealerSession(d.id);
  refresh();
  return { ok: true };
}

/**
 * "See the demo portal": signs into the seeded demo dealer without a PIN.
 * TODO: remove before launch (or set DEMO_PORTAL=0), it gives anyone the demo dealer's account.
 */
export async function signInDemo(): Promise<Result> {
  if (process.env.DEMO_PORTAL === "0") return { ok: false, error: WRONG };
  const d = await activeDealerByPhone("03016423718");
  if (!d) return { ok: false, error: WRONG };
  await startDealerSession(d.id);
  refresh();
  return { ok: true };
}

/** Ends this browser's dealer session (and only that one). */
export async function signOut(): Promise<Result> {
  await endDealerSession();
  refresh();
  return { ok: true };
}
