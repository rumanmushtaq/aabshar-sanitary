# Aabshar web

The Aabshar website in Next.js, built from the `aabshar-v7.html` design in the parent folder. English and Urdu, home and dealer prices, cart, checkout and the dealer portal. Data is sample data; there is no backend yet.

See [ARCHITECTURE.md](ARCHITECTURE.md) for routes, languages, shop state and styles.

## Run

Needs Node 20.9 or newer (built with Node 24).

```bash
npm install
npm run dev
```

Open http://localhost:3000. It redirects to `/en` (or `/ur`).

```bash
npm run build && npm start
```

## Checks

```bash
npx tsc --noEmit
npm run lint
```
