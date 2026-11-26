import type { Metadata } from "next";
import Link from "next/link";
import { listDealers, requireStaff } from "@/lib/admin-data";
import { PageHead } from "@/components/admin/bits";
import { day, num, rs } from "@/components/admin/format";

export const metadata: Metadata = { title: "Dealers" };

export default async function DealersPage() {
  const me = await requireStaff();
  const rows = await listDealers();
  const owed = rows.reduce((s, d) => s + Math.max(0, d.balance), 0);
  return (
    <>
      <PageHead title="Dealers" sub={`${num(rows.filter((d) => d.active).length)} active · ${rs(owed)} outstanding`}>
        {me.role === "admin" && <Link className="b pri" href="/admin/dealers/new">Add dealer</Link>}
      </PageHead>
      <div className="card flush">
        <div className="tw">
          <table className="t">
            <thead>
              <tr><th>Dealer</th><th>City</th><th>Phone</th><th className="num">Balance</th><th className="num">Credit limit</th><th className="num">Available</th><th>Last order</th></tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const avail = d.creditLimit - d.balance;
                return (
                  <tr key={d.id} className={d.active ? undefined : "off"}>
                    <td>
                      <Link className="rowlink" href={`/admin/dealers/${d.id}`}>{d.name}</Link>
                      <div className="small muted">Tier {d.tier} · {d.termsDays}-day terms{!d.active && " · inactive"}</div>
                    </td>
                    <td>{d.city}</td>
                    <td className="mono small">{d.phone}</td>
                    <td className="num" style={{ fontWeight: 600 }}>{rs(d.balance)}</td>
                    <td className="num">{rs(d.creditLimit)}</td>
                    <td className="num" style={{ color: avail < 0 ? "var(--bad)" : avail < d.creditLimit * 0.1 ? "var(--warn)" : undefined }}>{rs(avail)}</td>
                    <td className="small nowrap">{day(d.lastOrder)}</td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={7} className="empty">No dealers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
