import "server-only";
import { getAdmin } from "@/lib/auth";
import type { ActionResult } from "./schemas";

export type Staff = NonNullable<Awaited<ReturnType<typeof getAdmin>>>;

/** For server actions: the signed-in staff user, or an error result to return. */
export async function staffOrError(role?: "admin"): Promise<{ me: Staff; err?: never } | { me?: never; err: ActionResult }> {
  const me = await getAdmin();
  if (!me) return { err: { ok: false, error: "Your session has ended. Sign in again." } };
  if (role === "admin" && me.role !== "admin") return { err: { ok: false, error: "Only an admin can do this." } };
  return { me };
}

/** First zod issue as a short message. */
export function firstIssue(e: { issues: { message: string }[] }): ActionResult {
  return { ok: false, error: e.issues[0]?.message ?? "Check the form and try again." };
}

/** Postgres unique-violation check (drizzle wraps the pg error in `cause`). */
export function isUnique(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "23505" || err?.cause?.code === "23505";
}

/** Today's date in Pakistan as YYYY-MM-DD. */
export function todayPK(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
}
