import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { directDbUrl } from "./lib/db/url";

// .env.local (from `vercel env pull`) wins over .env.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: directDbUrl()! },
  strict: true,
});
