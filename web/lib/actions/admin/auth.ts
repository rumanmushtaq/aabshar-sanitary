"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { endAdminSession, hashSecret, startAdminSession, verifySecret } from "@/lib/auth";
import { loginSchema, passwordSchema, type ActionResult } from "./schemas";
import { firstIssue, staffOrError } from "./guard";

const BAD_LOGIN: ActionResult = { ok: false, error: "Email or password is wrong, or the account is not active." };
// Used when the email is unknown, so a wrong email takes as long as a wrong password.
let dummyHash: Promise<string> | null = null;

// 8 wrong tries per email in 15 minutes locks that email. In memory: resets on restart, per server instance.
const WINDOW_MS = 15 * 60_000;
const MAX_TRIES = 8;
const tries = new Map<string, { n: number; since: number }>();
function isLocked(email: string) {
  const t = tries.get(email);
  if (t && Date.now() - t.since > WINDOW_MS) tries.delete(email);
  return (tries.get(email)?.n ?? 0) >= MAX_TRIES;
}
function fail(email: string): ActionResult {
  const t = tries.get(email) ?? { n: 0, since: Date.now() };
  tries.set(email, { ...t, n: t.n + 1 });
  return BAD_LOGIN;
}

export async function adminLogin(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return BAD_LOGIN;
  const { email, password } = parsed.data;
  if (isLocked(email)) return { ok: false, error: "Too many tries. Wait 15 minutes and try again." };
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!u || !u.active) {
    dummyHash ??= hashSecret("not-a-real-password");
    await verifySecret(password, await dummyHash);
    return fail(email);
  }
  if (!(await verifySecret(password, u.passwordHash))) return fail(email);
  tries.delete(email);
  await startAdminSession(u.id);
  redirect("/admin");
}

export async function adminLogout(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}

/** Any signed-in user changes their own password. Other sessions of the user are signed out. */
export async function changeOwnPassword(input: unknown): Promise<ActionResult> {
  const { me, err } = await staffOrError();
  if (err) return err;
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, me.id)).limit(1);
  if (!u || !(await verifySecret(parsed.data.current, u.passwordHash))) return { ok: false, error: "Current password is wrong." };
  await db.update(schema.users).set({ passwordHash: await hashSecret(parsed.data.next) }).where(eq(schema.users.id, me.id));
  // Sign out everywhere, then start a fresh session here.
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, me.id));
  await startAdminSession(me.id);
  return { ok: true, msg: "Password changed. Other devices were signed out." };
}

