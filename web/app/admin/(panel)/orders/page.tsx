import type { Metadata } from "next";
import Link from "next/link";
import { listOrders, requireStaff } from "@/lib/admin-data";
import { PageHead, Pager, StatusBadge, one } from "@/components/admin/bits";
import { FilterBar } from "@/components/admin/ui";
import { PAY_LABEL, dayTime, num, rs } from "@/components/admin/format";

export const metadata: Metadata = { title: "Orders" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function OrdersPage({ searchParams }: Props) {
  await requireStaff();
  const sp = await searchParams;
  const f = { status: one(sp.status), kind: one(sp.kind), q: one(sp.q).slice(0, 100) };
  const page = Math.max(1, parseInt(one(sp.page), 10) || 1);
  const res = await listOrders({ ...f, page });
  return (
    <>
      <PageHead title="Orders" sub={`${num(res.total)} matching`} />
      <FilterBar
        key={JSON.stringify(f)}
        values={f}
        fields={[
          { name: "q", label: "Search", type: "search", placeholder: "Order no, name or phone" },
          { name: "status", label: "Status", type: "select", options: [["", "All statuses"], ["waiting", "Waiting (confirmed + packed)"], ["confirmed", "Confirmed"], ["packed", "Packed"], ["shipped", "Shipped"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]] },
          { name: "kind", label: "Kind", type: "select", options: [["", "Retail + dealer"], ["retail", "Retail"], ["dealer", "Dealer"]] },
        ]}
      />
      <div className="card flush">
        <div className="tw">
          <table className="t">
            <thead>
              <tr><th>Order</th><th>Customer</th><th>City</th><th>Status</th><th>Payment</th><th className="num">Items</th><th className="num">Total</th><th>Placed</th></tr>
            </thead>
            <tbody>
              {res.rows.map((o) => (
                <tr key={o.id}>
                  <td className="nowrap"><Link className="rowlink mono" href={`/admin/orders/${o.id}`}>{o.no}</Link>{o.kind === "dealer" && <span className="bd brass plain" style={{ marginLeft: 6 }}>Dealer</span>}</td>
                  <td>{o.name}<div className="small muted mono">{o.phone}</div></td>
                  <td>{o.city}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="small">{PAY_LABEL[o.pay] ?? o.pay}</td>
                  <td className="num">{o.items}{o.cartons ? <div className="small muted">{o.cartons} ctn</div> : null}</td>
                  <td className="num">{rs(o.total)}</td>
                  <td className="nowrap small">{dayTime(o.createdAt)}</td>
                </tr>
              ))}
              {!res.rows.length && <tr><td colSpan={8} className="empty">No orders match.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pager page={res.page} pages={res.pages} total={res.total} base="/admin/orders" params={f} />
      </div>
    </>
  );
}
