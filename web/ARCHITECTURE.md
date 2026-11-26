# Aabshar web — how it fits together

Next.js 16 (App Router, TypeScript) rebuild of the `aabshar-v7.html` design prototype in the parent folder. Frontend only: catalogue, dealers and orders are sample data in `lib/data.ts`. There is no database or payment yet.

## Routes

Every page lives under `app/[lang]/`, where `lang` is `en` or `ur`. `proxy.ts` sends any path without a language to the saved language (cookie `aab-lang`), or to Urdu when the browser asks for it, else English.

| Route | Screen |
| --- | --- |
| `/[lang]` | Homepage |
| `/[lang]/shop` | All products, filter by category (`?cat=`) |
| `/[lang]/p/[sku]` | Product page |
| `/[lang]/checkout` | Checkout (demo, nothing is charged) |
| `/[lang]/dealer` | Dealer portal: sign-in, then overview |
| `/[lang]/dealer/order`, `/khata`, `/orders` | Quick order, ledger, order tracking |

Homepage anchors: `#shop`, `#best`, `#plastic`, `#ways`, `#sets`, `#factory`, `#ideas`, `#find`, `#tankf`. Two hash forms also pick a tab when the homepage opens or the hash changes: `#plastic-tanks` / `#plastic-pipes` / `#plastic-home` select the plastic tab and scroll to `#plastic`; `#look-N` opens room N (0-based) in Shop the look and scrolls to `#ideas`.

## Languages

- English text is the translation key. `t("Add to cart")` returns the Urdu from `lib/i18n/ur/*.ts`, or the English when the page is English.
- `lib/i18n/ur/common.ts` holds every string from the prototype. Each screen area adds new strings to its own file (`chrome.ts`, `home.ts`, `product.ts`, `checkout.ts`, `dealer.ts`).
- Strings built at runtime ("12 pcs", "Add 1 carton · 10 pcs", "Rs 8,500 / pc") are translated by the patterns in `lib/i18n/ur/rules.ts`.
- A missing Urdu string shows the English and logs `[i18n] missing Urdu` in development. Urdu pages must not show English words, except product codes, the promo code and what the user types.
- Server components: `getT(lang)`, `rs(n, lang)`, `href(path, lang)` from `lib/i18n`. Client components: `useI18n()` from `components/providers.tsx`.
- `<html lang dir>` is set in `app/[lang]/layout.tsx`; the CSS switches to Nastaliq and right-to-left from `html[lang="ur"]` and `html[dir="rtl"]`.

## Shop state

`components/providers.tsx` (client) holds:

- `mode`: `retail` (home prices) or `dealer` (carton slab prices). It sets `body.retail` / `body.dealer`; markup with `data-show="retail"` or `data-show="dealer"` is shown by CSS, so server HTML can carry both prices.
- `cart` of `{ id, fin, qty }` lines, quantity always in pieces. Saved in `localStorage`.
- `toast()`, the open overlay (`cart`, `search`, `menu`, `qv`), quick-view product, and the demo dealer sign-in.

Prices come from `lib/pricing.ts` (`unitPrice`, `slabIndex`, `cartSum` ...) and delivery from `lib/shipping.ts`.

## Styles

`app/globals.css` is the prototype's stylesheet, with the class names unchanged; components reuse those classes. Fonts load through `next/font` and feed the `--f-*` variables.

## Forms

Forms use `react-hook-form` with `zod` schemas (`@hookform/resolvers/zod`), not `useState` per field.

## Backend

Postgres with Drizzle ORM. Local database: `npm run db:up` (Docker, port 55434), then `npm run db:migrate` and `npm run db:seed`. Settings live in `.env` (see `.env.example`).

| Path | What it is |
| --- | --- |
| `lib/db/schema.ts` | Tables: products, ship_rates, shops, dealers, ledger (khata), orders, order_items, order_events, promo_codes, subscribers, users (staff), sessions |
| `lib/db/index.ts` | Drizzle client (server only) |
| `drizzle/` | SQL migrations (`npm run db:generate` after a schema change) |
| `scripts/seed.ts` | Loads the sample data from `lib/data.ts`, a demo dealer and the first admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` |
| `lib/store.ts` | Cached reads for pages: `getCatalog`, `getProduct`, `getShipRates`, `getShops`, tagged with `TAG.*` |
| `lib/auth.ts` | Sessions for staff (`aab-admin` cookie) and dealers (`aab-dealer` cookie); only a SHA-256 of the token is stored |
| `lib/password.ts` | scrypt hashing for staff passwords and dealer PINs |

- The catalogue and delivery rates reach client components through `useCatalog()` (`components/providers.tsx`), filled by `app/[lang]/layout.tsx`.
- Prices are always recomputed on the server when an order is placed; the cart in the browser only holds SKU, finish and quantity.
- Every admin change calls `updateTag()` for the data it touched, so the shop shows it on the next request.
- `/admin` is the staff panel, in English. It has its own root layout and is not under `[lang]`.
- Mutations are server actions. Each one checks the session itself; the proxy does no auth.
