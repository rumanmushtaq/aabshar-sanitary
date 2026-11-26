import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrder, requireStaff } from "@/lib/admin-data";
import { PageHead } from "@/components/admin/bits";
import { PrintButton } from "@/components/admin/order-status-form";
import { PAY_LABEL, SPEED_LABEL, day, num, rs } from "@/components/admin/format";
import { FIN, type FinishId } from "@/lib/data";

export const metadata: Metadata = { title: "Packing slip" };

export default async function SlipPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const data = await getOrder(id);
  if (!data) notFound();
  const { order: o, items } = data;
  const cod = o.pay === "cod";
  return (
    <>
      <div className="no-print">
        <PageHead crumb={[o.no, `/admin/orders/${o.id}`]} title="Packing slip">
          <PrintButton />
        </PageHead>
      </div>
      <article className="slip">
        <div className="slip-head">
          <div><b>Aabshar</b><div className="small muted">Sanitary fittings &amp; plastics · Gujranwala</div></div>
          <div style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: "1.2rem", fontWeight: 700 }}>{o.no}</div>
            <div className="small">{day(o.createdAt)} · {SPEED_LABEL[o.speed] ?? o.speed}</div>
          </div>
        </div>
        <div className="fg g2" style={{ marginBottom: 16 }}>
          <div className="box">
            <div className="lbl">Ship to</div>
            <div style={{ fontWeight: 700 }}>{o.name}</div>
            <div>{o.addr}</div>
            <div>{o.area}, {o.city}</div>
            {o.mark && <div className="small">Near: {o.mark}</div>}
            <div className="mono">{o.phone}</div>
          </div>
          <div className="box">
            <div className="lbl">Payment</div>
            <div style={{ fontWeight: 700 }}>{PAY_LABEL[o.pay] ?? o.pay}</div>
            {cod ? <div>Collect <b>{rs(o.total)}</b> on delivery</div> : <div>Nothing to collect</div>}
            {o.cartons > 0 && <div className="small">{num(o.cartons)} cartons</div>}
          </div>
        </div>
        <table className="t">
          <thead><tr><th style={{ width: 28 }}>✓</th><th>SKU</th><th>Product</th><th>Finish</th><th className="num">Qty</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>☐</td>
                <td className="mono">{i.sku}</td>
                <td>{i.name}</td>
                <td>{FIN[i.fin as FinishId]?.label ?? (i.fin || "–")}</td>
                <td className="num" style={{ fontWeight: 700 }}>{num(i.qty)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td colSpan={4} className="num">Pieces</td><td className="num">{num(items.reduce((s, i) => s + i.qty, 0))}</td></tr></tfoot>
        </table>
        <div className="sign"><div>Packed by</div><div>Received by (name, signature)</div></div>
      </article>
    </>
  );
}
