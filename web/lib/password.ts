import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Passwords and dealer PINs are stored as scrypt hashes: "scrypt$<salt>$<hash>", both base64url.
const scrypt = promisify(scryptCb) as (secret: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashSecret(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(secret, salt, 32);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verifySecret(secret: string, stored: string): Promise<boolean> {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const want = Buffer.from(hash, "base64url");
  const got = await scrypt(secret, Buffer.from(salt, "base64url"), want.length);
  return timingSafeEqual(got, want);
}
