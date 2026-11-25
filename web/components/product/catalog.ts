// Catalogue helpers for the product page and shop listing (ported from v7 gallery / related).
import { BY, CATALOG, LOOKS, type Product } from "@/lib/data";

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

/** "Goes well with": same category first, then the core set for metal or plastic. */
export function related(p: Product): Product[] {
  const same = CATALOG.filter((x) => x.id !== p.id && x.cat === p.cat);
  const setIds = p.id.startsWith("AP-")
    ? ["AP-T500", "AP-2020", "AP-2040", "AP-3200"]
    : ["AB-1204", "AB-5102", "AB-3310", "AB-7720", "AB-6510"];
  const more = setIds.map((id) => BY[id]).filter((x) => x && x.id !== p.id && !same.includes(x));
  return [...same, ...more].slice(0, 4);
}

/** URL slug for a category: "Taps & Mixers" -> "taps-mixers". */
export const catSlug = (cat: string) => cat.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-+|-+$/g, "");

/** Distinct categories in catalogue order. */
export const CATS: string[] = [...new Set(CATALOG.map((p) => p.cat))];
