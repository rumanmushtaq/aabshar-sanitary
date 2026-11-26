import Link from "next/link";
import { getDashboard, requireStaff } from "@/lib/admin-data";
import { PageHead, StatusBadge } from "@/components/admin/bits";
import { dayTime, num, pcs, rs } from "@/components/admin/format";

export default async function Dashboard() {
  const me = await requireStaff();
  const d = await getDashboard();
  return (
    <>
      <PageHead title="Dashboard" sub={`Salaam, ${me.name}. Figures exclude cancelled orders; days are Pakistan time.`} />
      <div className="kpis">
        <div className="kpi"><div className="l">Today</div><div className="v">{rs(d.todayRs)}</div><div className="s">{num(d.todayN)} orders</div></div>
        <div className="kpi"><div className="l">Last 7 days</div><div className="v">{rs(d.weekRs)}</div><div className="s">{num(d.weekN)} orders</div></div>
        <Link className={"kpi" + (d.waiting ? " warn" : "")} href="/admin/orders?status=waiting"><div className="l">Waiting to ship</div><div className="v">{num(d.waiting)}</div><div className="s">Confirmed or packed</div></Link>
        <Link className="kpi" href="/admin/dealers"><div className="l">Dealer credit outstanding</div><div className="v">{rs(d.outstanding)}</div><div className="s">All khata balances</div></Link>
        <Link className={"kpi" + (d.low.length ? " warn" : "")} href="/admin/products?stock=low"><div className="l">Low stock</div><div className="v">{num(d.low.length)}</div><div className="s">Under 2 cartons</div></Link>
      </div>
      <div className="cols">
        <section className="card flush">
          <h2 className="h">Recent orders</h2>
          <div className="tw">
            <table className="t">
              <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th className="num">Total</th><th>Placed</th></tr></thead>
              <tbody>
                {d.recent.map((o) => (
                  <tr key={o.id}>
                    <td><Link className="rowlink mono" href={`/admin/orders/${o.id}`}>{o.no}</Link>{o.kind === "dealer" && <span className="bd brass plain" style={{ marginLeft: 6 }}>Dealer</span>}</td>
                    <td>{o.name}<div className="small muted">{o.city}</div></td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="num">{rs(o.total)}</td>
                    <td className="nowrap small">{dayTime(o.createdAt)}</td>
                  </tr>
                ))}
                {!d.recent.length && <tr><td colSpan={5} className="empty">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="pager"><span /><Link className="b sm" href="/admin/orders">All orders →</Link></div>
        </section>
        <section className="card flush">
          <h2 className="h">Low stock (under 2 cartons)</h2>
          <div className="tw">
            <table className="t">
              <thead><tr><th>Product</th><th className="num">In stock</th></tr></thead>
              <tbody>
                {d.low.map((p) => (
                  <tr key={p.id}>
                    <td><Link className="rowlink" href={`/admin/products/${encodeURIComponent(p.id)}`}>{p.name}</Link><div className="small muted mono">{p.id}</div></td>
                    <td className="num" style={{ color: p.stock === 0 ? "var(--bad)" : "var(--warn)" }}>{pcs(p.stock, p.carton)}</td>
                  </tr>
                ))}
                {!d.low.length && <tr><td colSpan={2} className="empty">Every product has 2 cartons or more.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
