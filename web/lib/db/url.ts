import { setDefaultAutoSelectFamilyAttemptTimeout } from "node:net";

// Node tries each address of a host for only 250 ms before the next one. From Pakistan to Neon in
// US East that is too short and every attempt times out, so allow 3 s. Imported by the app, the
// migrations config and the seed script, so all three get it.
setDefaultAutoSelectFamilyAttemptTimeout(3000);

// Connection strings. Vercel's Neon integration sets DATABASE_URL (pooled) and DATABASE_URL_UNPOOLED (direct);
// `vercel env pull .env.local` brings the same values to a local machine.
// The app uses the pooled URL; migrations and the seed script use the direct one.
export const appDbUrl = () => process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
export const directDbUrl = () => process.env.DATABASE_URL_UNPOOLED ?? process.env.POSTGRES_URL_NON_POOLING ?? appDbUrl();
