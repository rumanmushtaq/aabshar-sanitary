// Fills an empty database with the sample catalogue, delivery rates, dealer shops,
// one demo dealer with a khata and orders, a promo code and the first admin.
// Safe to re-run: existing rows are left alone.
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../lib/db/schema";
import { BY, CATALOG, CITIES, DEALER, LAST, LEDGER, ORDERS, SHIP } from "../lib/data";
import { hashSecret } from "../lib/password";
import ur from "../lib/i18n/ur";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

/** Demo dealer login: mobile 0301-6423718, PIN 1234. */
export const DEMO_DEALER = { phone: "03016423718", pin: "1234" };

async function main() {
  await db
    .insert(schema.products)
    .values(
      CATALOG.map((p, i) => ({
        id: p.id, name: p.name, cat: p.cat, img: p.img, alt: p.alt, pos: p.pos, crop: p.crop, cimg: p.cimg,
        price: p.price, was: p.was, carton: p.carton, slabs: [...p.slabs], flag: p.flag, sale: !!p.sale,
        fins: [...p.fins], specs: [...p.specs], pt: p.pt, pack: p.pack, sub: p.sub, wty: p.wty, tags: p.tags,
        nameUr: ur[p.name], subUr: p.sub ? ur[p.sub] : undefined, specsUr: p.specs.every((x) => ur[x]) ? p.specs.map((x) => ur[x]) : undefined,
        stock: p.id.startsWith("AP-T") ? 40 : p.carton * 30,
        sort: i,
      })),
    )
    .onConflictDoNothing();
  // Fill Urdu on rows seeded before those columns existed.
  for (const p of CATALOG) {
    if (!ur[p.name]) continue;
    await db.update(schema.products).set({ nameUr: ur[p.name], subUr: p.sub ? ur[p.sub] : null, specsUr: p.specs.every((x) => ur[x]) ? p.specs.map((x) => ur[x]) : null })
      .where(sql`${schema.products.id} = ${p.id} and ${schema.products.nameUr} is null`);
  }

  await db
    .insert(schema.shipRates)
    .values(Object.entries(SHIP).map(([city, s]) => ({ city, days: s.d, fee: s.f, freeOver: city === "Gujranwala" || city === "Lahore" })))
    .onConflictDoNothing();

  const [{ n: shopCount }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.shops);
  if (!shopCount) {
    await db.insert(schema.shops).values(
      Object.entries(CITIES).flatMap(([city, c]) => c.list.map(([name, area, phone], i) => ({ city, name, area, phone, sort: i }))),
    );
  }

  await db.insert(schema.promoCodes).values({ code: "AABSHAR5", pct: 5 }).onConflictDoNothing();

  // Demo dealer with an opening balance, the sample khata and three orders on credit.
  const [existing] = await db.select().from(schema.dealers).where(sql`${schema.dealers.phone} = ${DEMO_DEALER.phone}`);
  if (!existing) {
    const [d] = await db
      .insert(schema.dealers)
      .values({
        name: DEALER.name, initials: DEALER.init, city: DEALER.city, phone: DEMO_DEALER.phone,
        pinHash: await hashSecret(DEMO_DEALER.pin), tier: DEALER.tier, since: DEALER.since,
        creditLimit: DEALER.limit, manager: DEALER.manager,
      })
      .returning();

    // Each sample order gets lines from the dealer's usual products at slab prices.
    const debits: Record<string, number> = {};
    const stages = ["confirmed", "packed", "shipped", "delivered"] as const;
    for (const [k, o] of ORDERS.entries()) {
      const lines = LAST.slice(0, 3 + k).map(([id, ctn]) => {
        const p = BY[id];
        const qty = ctn * (k + 2) * p.carton;
        const c = qty / p.carton;
        const unit = p.slabs[c >= 20 ? 2 : c >= 5 ? 1 : 0];
        return { sku: id, name: p.name, fin: p.fins[0] ?? "", qty, unitPrice: unit, lineTotal: unit * qty };
      });
      const total = lines.reduce((a, l) => a + l.lineTotal, 0);
      debits[o.no] = total;
      const at = new Date(o.date + "T10:00:00+05:00");
      const [row] = await db
        .insert(schema.orders)
        .values({
          no: o.no, kind: "dealer", dealerId: d.id, status: stages[o.st], name: d.name, phone: d.phone, city: d.city,
          area: "Sheikhupura Road", addr: "Shop 4, Main Bazaar", speed: "truck", pay: "credit",
          subtotal: total, total, cartons: lines.reduce((a, l) => a + l.qty / BY[l.sku].carton, 0), createdAt: at,
        })
        .returning();
      await db.insert(schema.orderItems).values(lines.map((l) => ({ ...l, orderId: row.id })));
      await db.insert(schema.orderEvents).values(
        stages.slice(0, o.st + 1).map((s, i) => ({ orderId: row.id, status: s, at: new Date(at.getTime() + i * 86400_000) })),
      );
    }

    const rows = LEDGER.map(([day, ref, detail, dr, cr]) => ({ dealerId: d.id, day, ref, detail, debit: debits[ref] ?? dr, credit: cr }));
    const net = rows.reduce((a, r) => a + r.debit - r.credit, 0);
    rows.push({ dealerId: d.id, day: "2026-10-01", ref: "OPEN-2026", detail: "Opening balance", debit: Math.max(0, DEALER.used - net), credit: 0 });
    await db.insert(schema.ledger).values(rows);
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    await db
      .insert(schema.users)
      .values({ email, name: "Admin", passwordHash: await hashSecret(password), role: "admin" })
      .onConflictDoNothing();
  } else {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set: no admin user created.");
  }

  console.log("Seed done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
