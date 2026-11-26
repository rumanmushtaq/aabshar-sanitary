# Aabshar web

The Aabshar website in Next.js, built from the `aabshar-v7.html` design in the parent folder: shop in English and Urdu with home and dealer prices, checkout that saves orders, order tracking, the dealer portal (login, khata, orders) and the staff admin panel at `/admin`. Neon Postgres with Drizzle ORM, hosted on Vercel. Online payment is not connected yet: orders are cash on delivery or confirmed on WhatsApp.

See [ARCHITECTURE.md](ARCHITECTURE.md) for routes, languages, shop state and styles.

## Run

Needs Node 20.9 or newer (built with Node 24) and the Vercel CLI, logged in, with this folder linked to the `aabshar-sanitary` project.

```bash
npm install
npm run env:pull       # Neon connection strings into .env.local
cp .env.example .env   # then set ADMIN_EMAIL and ADMIN_PASSWORD
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000. It redirects to `/en` (or `/ur`). Staff sign in at http://localhost:3000/admin with the admin email and password from `.env`. The demo dealer is mobile 0301-6423718, PIN 1234 (or the "See the demo portal" button, turned off with `DEMO_PORTAL=0`).

```bash
npm run build && npm start
```

## Checks

```bash
npx tsc --noEmit
npm run lint
```
