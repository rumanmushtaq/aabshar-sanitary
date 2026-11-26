import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDealerFull, requireStaff } from "@/lib/admin-data";
import { PageHead, StatusBadge } from "@/components/admin/bits";
import { ActionButton } from "@/components/admin/ui";
import { DealerForm, PaymentForm, PinForm } from "@/components/admin/dealer-form";
import { setDealerActive } from "@/lib/actions/admin/dealers";
import { todayPK } from "@/lib/actions/admin/guard";
import type { DealerEditInput } from "@/lib/actions/admin/schemas";
import { day, dayTime, rs } from "@/components/admin/format";

export const metadata: Metadata = { title: "Dealer" };

export default async function DealerPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireStaff();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const data = await getDealerFull(id);
  if (!data) notFound();
  const { dealer: d, entries, balance, recent } = data;
  const isAdmin = me.role === "admin";
  const avail = d.creditLimit - balance;
  return (
    <>
      <PageHead
        crumb={["Dealers", "/admin/dealers"]}
        title={d.name}
        sub={<>{d.city} · <span className="mono">{d.phone}</span> · Tier {d.tier} · since {d.since}{!d.active && <> · <span className="bd bad">Inactive</span></>}</>}
      >
        {isAdmin && (
          <ActionButton
            action={setDealerActive.bind(null, d.id, !d.active)}
            label={d.active ? "Deactivate" : "Reactivate"}
            className={"b" + (d.active ? " danger" : "")}
            confirm={d.active ? "Deactivate this dealer? They are signed out and cannot order until reactivated." : undefined}
          />
        )}
      </PageHead>

      <div className="kpis">
        <div className="kpi"><div className="l">Balance owed</div><div className="v">{rs(balance)}</div><div className="s">Debits − credits</div></div>
        <div className="kpi"><div className="l">Credit limit</div><div className="v">{rs(d.creditLimit)}</div><div className="s">{d.termsDays}-day terms</div></div>
        <div className={"kpi" + (avail < 0 ? " warn" : "")}><div className="l">Available credit</div><div className="v">{rs(avail)}</div></div>
      </div>

      <div className="cols">
        <div className="stack">
          <section className="card flush">
            <h2 className="h">Khata ledger</h2>
            <div className="tw">
              <table className="t">
                <thead><tr><th>Date</th><th>Ref</th><th>Detail</th><th className="num">Debit</th><th className="num">Credit</th><th className="num">Balance</th></tr></thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td className="nowrap small">{day(e.day)}</td>
                      <td className="mono small">{e.ref}</td>
                      <td>{e.detail}</td>
                      <td className="num">{e.debit ? rs(e.debit) : ""}</td>
                      <td className="num" style={{ color: "var(--ok)" }}>{e.credit ? rs(e.credit) : ""}</td>
                      <td className="num" style={{ fontWeight: 600 }}>{rs(e.balance)}</td>
                    </tr>
                  ))}
                  {!entries.length && <tr><td colSpan={6} className="empty">No entries yet.</td></tr>}
                </tbody>
                {entries.length > 0 && (
                  <tfoot><tr><td colSpan={5} className="num">Balance owed</td><td className="num">{rs(balance)}</td></tr></tfoot>
                )}
              </table>
            </div>
          </section>
          <section className="card">
            <h2 className="h">Details</h2>
            <DealerForm mode="edit" isAdmin={isAdmin} values={{ id: d.id, name: d.name, initials: d.initials, city: d.city, phone: d.phone, tier: d.tier as DealerEditInput["tier"], since: d.since, creditLimit: d.creditLimit, termsDays: d.termsDays, manager: d.manager }} />
          </section>
        </div>
        <div className="stack">
          <section className="card">
            <h2 className="h">Record a payment</h2>
            <PaymentForm dealerId={d.id} today={todayPK()} />
          </section>
          <section className="card flush">
            <h2 className="h">Recent orders</h2>
            <div className="tw">
              <table className="t">
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id}>
                      <td><Link className="rowlink mono" href={`/admin/orders/${o.id}`}>{o.no}</Link><div className="small muted">{dayTime(o.createdAt)}</div></td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="num">{rs(o.total)}</td>
                    </tr>
                  ))}
                  {!recent.length && <tr><td className="empty">No orders yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
          <section className="card">
            <h2 className="h">Reset portal PIN</h2>
            <PinForm id={d.id} />
          </section>
        </div>
      </div>
    </>
  );
}
