import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { appDbUrl } from "./url";

// One pool per server process; reused across hot reloads in development.
const g = globalThis as unknown as { aabPool?: Pool };
const pool = g.aabPool ?? new Pool({ connectionString: appDbUrl(), max: 5 });
if (process.env.NODE_ENV !== "production") g.aabPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
