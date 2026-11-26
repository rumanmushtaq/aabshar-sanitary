import type { NextRequest } from "next/server";
import { getT } from "@/lib/i18n";
import { hasLang } from "@/lib/i18n/config";
import { csvResponse, getKhata, toCsv } from "@/lib/dealer-data";

/** The signed-in dealer's khata as CSV, oldest entry first. ?lang=ur gives Urdu headings and details. */
export async function GET(req: NextRequest) {
  const k = await getKhata();
  if (!k) return new Response("Sign in to the dealer portal first.", { status: 401 });
  const lang = req.nextUrl.searchParams.get("lang") ?? "en";
  const t = getT(hasLang(lang) ? lang : "en");
  const rows: (string | number)[][] = [
    ["Date", "Reference", "Detail", "Debit", "Credit", "Balance"].map(t),
    ...k.rows.map((r) => [r.day, r.ref, t(r.detail), r.debit, r.credit, r.balance]),
  ];
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  return csvResponse(toCsv(rows), `aabshar-khata-${today}.csv`);
}
