import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, requireStaff } from "@/lib/admin-data";
import { PageHead, StatusBadge } from "@/components/admin/bits";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { PAY_LABEL, SPEED_LABEL, dayTime, num, rs } from "@/components/admin/format";
import { FIN, type FinishId } from "@/lib/data";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const data = await getOrder(id);
  if (!data) notFound();
  const { order: o, items, events, dealer } = data;
  const pieces = items.reduce((s, i) => s + i.qty, 0);
  return (
    <>
      <PageHead
        crumb={["Orders", "/admin/orders"]}
        title={<span className="mono" style={{ fontFamily: "var(--f-display)" }}>{o.no}</span>}
        sub={<>Placed {dayTime(o.createdAt)} · {o.kind === "dealer" ? "Dealer order" : "Retail order"} · <StatusBadge status={o.status} /></>}
      >
        <Link className="b" href={`/admin/orders/${o.id}/slip`}>Packing slip</Link>
      </PageHead>
      <div className="cols">
        <div className="stack">
          <section className="card flush">
            <h2 className="h">Items</h2>
            <div className="tw">
              <table className="t">
                <thead><tr><th>Product</th><th>Finish</th><th className="num">Qty</th><th className="num">Unit</th><th className="num">Line</th></tr></thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td><Link className="rowlink" href={`/admin/products/${encodeURIComponent(i.sku)}`}>{i.name}</Link><div className="small muted mono">{i.sku}</div></td>
                      <td>{FIN[i.fin as FinishId]?.label ?? (i.fin || "–")}</td>
                      <td className="num">{num(i.qty)}</td>
                      <td className="num">{rs(i.unitPrice)}</td>
                      <td className="num">{rs(i.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={4} className="num muted" style={{ fontWeight: 500 }}>Subtotal ({num(pieces)} pcs{o.cartons ? `, ${o.cartons} ctn` : ""})</td><td className="num">{rs(o.subtotal)}</td></tr>
                  {o.discount > 0 && <tr><td colSpan={4} className="num muted" style={{ fontWeight: 500 }}>Discount{o.promo ? ` (${o.promo})` : ""}</td><td className="num">− {rs(o.discount)}</td></tr>}
                  <tr><td colSpan={4} className="num muted" style={{ fontWeight: 500 }}>Delivery ({SPEED_LABEL[o.speed] ?? o.speed})</td><td className="num">{o.fee ? rs(o.fee) : "Free"}</td></tr>
                  <tr><td colSpan={4} className="num">Total</td><td className="num">{rs(o.total)}</td></tr>
                </tfoot>
              </table>
            </div>
          </section>
          <section className="card">
            <h2 className="h">Timeline</h2>
            <ol className="tl">
              {events.map((e) => (
                <li key={e.id}>
                  <StatusBadge status={e.status} />
                  <span className="when"> {dayTime(e.at)}{e.by ? ` · ${e.by}` : ""}</span>
                  {e.note && <div><span className="note">{e.note}</span></div>}
                </li>
              ))}
              {!events.length && <li className="muted">No events yet.</li>}
            </ol>
          </section>
        </div>
        <div className="stack">
          <section className="card">
            <h2 className="h">Change status</h2>
            <OrderStatusForm id={o.id} current={o.status} dealerCredit={o.kind === "dealer" && o.pay === "credit"} />
          </section>
          <section className="card">
            <h2 className="h">Customer</h2>
            <dl className="facts">
              <dt>Name</dt><dd>{o.name}</dd>
              <dt>Phone</dt><dd className="mono"><a href={`tel:${o.phone}`}>{o.phone}</a></dd>
              {o.email && <><dt>Email</dt><dd>{o.email}</dd></>}
              {dealer && <><dt>Dealer</dt><dd><Link href={`/admin/dealers/${dealer.id}`}>{dealer.name}</Link></dd></>}
              <dt>Language</dt><dd>{o.lang === "ur" ? "Urdu" : "English"}</dd>
            </dl>
          </section>
          <section className="card">
            <h2 className="h">Delivery</h2>
            <dl className="facts">
              <dt>Address</dt><dd>{o.addr}</dd>
              <dt>Area</dt><dd>{o.area}</dd>
              <dt>City</dt><dd>{o.city}</dd>
              {o.mark && <><dt>Landmark</dt><dd>{o.mark}</dd></>}
              <dt>Speed</dt><dd>{SPEED_LABEL[o.speed] ?? o.speed}</dd>
            </dl>
          </section>
          <section className="card">
            <h2 className="h">Payment</h2>
            <dl className="facts">
              <dt>Method</dt><dd>{PAY_LABEL[o.pay] ?? o.pay}</dd>
              <dt>Total</dt><dd>{rs(o.total)}</dd>
              {o.promo && <><dt>Promo</dt><dd className="mono">{o.promo}</dd></>}
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
