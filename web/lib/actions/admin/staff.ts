"use server";

import { refresh } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { hashSecret } from "@/lib/auth";
import { idSchema, userSchema, type ActionResult } from "./schemas";
import { firstIssue, isUnique, staffOrError } from "./guard";

const { users, sessions } = schema;

/** Admin only: adds a staff user. */
export async function addUser(input: unknown): Promise<ActionResult> {
  const { err } = await staffOrError("admin");
  if (err) return err;
  const parsed = userSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const { password, ...v } = parsed.data;
  try {
    await db.insert(users).values({ ...v, passwordHash: await hashSecret(password) });
  } catch (e) {
    if (isUnique(e)) return { ok: false, error: "A user with this email already exists." };
    throw e;
  }
  refresh();
  return { ok: true, msg: `${v.name} added.` };
}

/** Admin only: deactivates (and signs out) or reactivates a user. Not yourself. */
export async function setUserActive(id: number, active: boolean): Promise<ActionResult> {
  const { me, err } = await staffOrError("admin");
  if (err) return err;
  const parsed = z.object({ id: idSchema, active: z.boolean() }).safeParse({ id, active });
  if (!parsed.success) return firstIssue(parsed.error);
  if (parsed.data.id === me.id) return { ok: false, error: "You cannot deactivate your own account." };
  await db.update(users).set({ active: parsed.data.active }).where(eq(users.id, parsed.data.id));
  if (!parsed.data.active) await db.delete(sessions).where(eq(sessions.userId, parsed.data.id));
  refresh();
  return { ok: true };
}
