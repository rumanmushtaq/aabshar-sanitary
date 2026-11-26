import { getAdmin } from "@/lib/auth";
import { allSubscribers } from "@/lib/admin-data";

/** Quotes a CSV cell; a leading = + - @ is escaped so spreadsheets don't run it as a formula. */
function cell(v: string): string {
  const safe = /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** GET /api/admin/subscribers.csv — newsletter subscribers, signed-in staff only. */
export async function GET() {
  const me = await getAdmin();
  if (!me) return new Response("Not signed in", { status: 401 });
  const rows = await allSubscribers();
  const lines = [
    ["email", "lang", "subscribed_at"].join(","),
    ...rows.map((r) => [cell(r.email), cell(r.lang), cell(r.createdAt.toISOString())].join(",")),
  ];
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
  return new Response("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aabshar-subscribers-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
