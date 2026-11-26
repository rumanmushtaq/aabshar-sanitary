import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { hashSecret, verifySecret } from "./password";

export { hashSecret, verifySecret };

const ADMIN_COOKIE = "aab-admin";
const DEALER_COOKIE = "aab-dealer";
const DAYS = 30;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

async function startSession(cookie: string, owner: { userId?: number; dealerId?: number }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DAYS * 86400_000);
  await db.insert(schema.sessions).values({ id: sha256(token), ...owner, expiresAt });
  (await cookies()).set(cookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

async function endSession(cookie: string) {
  const jar = await cookies();
  const token = jar.get(cookie)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)));
  jar.delete(cookie);
}

async function sessionRow(cookie: string) {
  const token = (await cookies()).get(cookie)?.value;
  if (!token) return null;
  const [row] = await db
    .select()
    .from(schema.sessions)
    .where(and(eq(schema.sessions.id, sha256(token)), gt(schema.sessions.expiresAt, sql`now()`)))
    .limit(1);
  return row ?? null;
}

/* ---------- staff ---------- */

export const startAdminSession = (userId: number) => startSession(ADMIN_COOKIE, { userId });
export const endAdminSession = () => endSession(ADMIN_COOKIE);

/** The signed-in staff user, or null. */
export async function getAdmin() {
  const s = await sessionRow(ADMIN_COOKIE);
  if (!s?.userId) return null;
  const [u] = await db.select().from(schema.users).where(and(eq(schema.users.id, s.userId), eq(schema.users.active, true))).limit(1);
  return u ? { id: u.id, email: u.email, name: u.name, role: u.role } : null;
}

/* ---------- dealers ---------- */

export const startDealerSession = (dealerId: number) => startSession(DEALER_COOKIE, { dealerId });
export const endDealerSession = () => endSession(DEALER_COOKIE);

/** The signed-in dealer, or null. */
export async function getDealer() {
  const s = await sessionRow(DEALER_COOKIE);
  if (!s?.dealerId) return null;
  const [d] = await db.select().from(schema.dealers).where(and(eq(schema.dealers.id, s.dealerId), eq(schema.dealers.active, true))).limit(1);
  return d ?? null;
}
