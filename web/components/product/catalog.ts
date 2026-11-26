// Catalogue helpers for the product page, shop listing and homepage (ported from v7 gallery / related).
// Products come from the database (getCatalog() on the server, useCatalog() in the browser);
// LOOKS, SET, PT, TANKS and BEST only name SKUs, so every id is resolved here and missing ones are skipped.
import { LOOKS, type Look, type LookItem, type Product } from "@/lib/data";
import type { ById } from "@/lib/pricing";
import type { Lang } from "@/lib/i18n/config";
import { productText } from "@/lib/i18n";

/** One gallery photo. zoom: a crop of a room photo, shown scaled around pos. look: index into LOOKS. */
export type GalleryImg = { src: string; pos: string; zoom?: boolean; look?: number };

export function gallery(p: Product): GalleryImg[] {
  const g: GalleryImg[] = [];
  if (p.img) g.push({ src: p.img, pos: p.pos ?? "50% 50%" });
  if (p.alt) g.push({ src: p.alt, pos: "50% 50%" });
  LOOKS.forEach((L, i) => {
    for (const it of L.items) if (it[0] === p.id) g.push({ src: L.img, pos: `${it[1]}% ${it[2]}%`, zoom: true, look: i });
  });
  if (!g.length && p.crop) g.push({ src: p.cimg ?? "/img/look.jpg", pos: p.crop, zoom: true });
  return g;
}

/** Indexes of the rooms in Shop the look that show this product. */
export const looksWith = (p: Product) =>
  LOOKS.flatMap((L, i) => (L.items.some((it) => it[0] === p.id) ? [i] : []));

/** Hotspots of a room whose products are in the catalogue. */
export const lookItems = (L: Look, by: ById): LookItem[] => L.items.filter((it) => by[it[0]]);

/** Products for a list of SKUs, skipping SKUs not in the catalogue (missing or inactive). */
export const pick = (ids: string[], by: ById): Product[] => ids.flatMap((id) => (by[id] ? [by[id]] : []));

/** "Goes well with": same category first, then the core set for metal or plastic. */
export function related(p: Product, catalog: Product[], by: ById): Product[] {
  const same = catalog.filter((x) => x.id !== p.id && x.cat === p.cat);
  const setIds = p.id.startsWith("AP-")
    ? ["AP-T500", "AP-2020", "AP-2040", "AP-3200"]
    : ["AB-1204", "AB-5102", "AB-3310", "AB-7720", "AB-6510"];
  const more = pick(setIds, by).filter((x) => x.id !== p.id && !same.includes(x));
  return [...same, ...more].slice(0, 4);
}

/** URL slug for a category: "Taps & Mixers" -> "taps-mixers". */
export const catSlug = (cat: string) => cat.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-+|-+$/g, "");

/** Distinct categories in catalogue order. */
export const catsOf = (catalog: Product[]): string[] => [...new Set(catalog.map((p) => p.cat))];

/** Product name in a language (admin-entered Urdu first). */
export const pname = (p: Product, lang: Lang) => productText(p, lang).name;

/** Nothing left to sell. */
export const soldOut = (p: Product) => (p.stock ?? 1) <= 0;

/** Shown as "Only N left" under this many pieces. */
export const LOW_STOCK = 10;
