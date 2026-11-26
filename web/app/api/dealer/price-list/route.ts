import type { NextRequest } from "next/server";
import { getT, productText } from "@/lib/i18n";
import { hasLang } from "@/lib/i18n/config";
import { getCatalog } from "@/lib/store";
import { csvResponse, getDealerInfo, toCsv } from "@/lib/dealer-data";

/** Dealer price list as CSV: active products, pieces per carton and the three slab prices per piece. */
export async function GET(req: NextRequest) {
  if (!(await getDealerInfo())) return new Response("Sign in to the dealer portal first.", { status: 401 });
  const q = req.nextUrl.searchParams.get("lang") ?? "en";
  const lang = hasLang(q) ? q : "en";
  const t = getT(lang);
  const catalog = await getCatalog();
  const rows: (string | number)[][] = [
    ["SKU", "Product", "Category", "Pieces per carton", "Price per piece, 1–4 cartons", "Price per piece, 5–19 cartons", "Price per piece, 20+ cartons"].map(t),
    ...catalog.map((p) => [p.id, productText(p, lang).name, t(p.cat), p.carton, ...p.slabs]),
  ];
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  return csvResponse(toCsv(rows), `aabshar-price-list-${today}.csv`);
}
