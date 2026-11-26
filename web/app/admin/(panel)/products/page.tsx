import type { Metadata } from "next";
import Link from "next/link";
import { listCategories, listProducts, requireStaff } from "@/lib/admin-data";
import { PageHead, one } from "@/components/admin/bits";
import { ActionButton, FilterBar } from "@/components/admin/ui";
import { StockAdjust } from "@/components/admin/product-form";
import { setProductActive } from "@/lib/actions/admin/products";
import { num, pcs, rs } from "@/components/admin/format";

export const metadata: Metadata = { title: "Products" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ProductsPage({ searchParams }: Props) {
  await requireStaff();
  const sp = await searchParams;
  const f = { q: one(sp.q).slice(0, 100), cat: one(sp.cat).slice(0, 60), state: one(sp.state), stock: one(sp.stock) };
  const [rows, cats] = await Promise.all([listProducts(f), listCategories()]);
  return (
    <>
      <PageHead title="Products" sub={`${num(rows.length)} shown · stock is counted in pieces`}>
        <Link className="b pri" href="/admin/products/new">Add product</Link>
      </PageHead>
      <FilterBar
        key={JSON.stringify(f)}
        values={f}
        fields={[
          { name: "q", label: "Search", type: "search", placeholder: "SKU, name or tag" },
          { name: "cat", label: "Category", type: "select", options: [["", "All categories"], ...cats.map((c) => [c, c] as [string, string])] },
          { name: "state", label: "Shown in shop", type: "select", options: [["", "Active + hidden"], ["active", "Active"], ["inactive", "Hidden"]] },
          { name: "stock", label: "Stock", type: "select", options: [["", "Any stock"], ["low", "Under 2 cartons"], ["out", "Out of stock"]] },
        ]}
      />
      <div className="card flush">
        <div className="tw">
          <table className="t">
            <thead>
              <tr><th></th><th>Product</th><th>Category</th><th className="num">Price</th><th className="num">Stock</th><th>Adjust stock</th><th>Shop</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const low = p.stock < 2 * p.carton;
                const pic = p.img || p.cimg;
                return (
                  <tr key={p.id} className={p.active ? undefined : "off"}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail */}
                    <td style={{ width: 52 }}>{pic ? <img className="thumb" src={pic} alt="" loading="lazy" /> : <span className="thumb" />}</td>
                    <td><Link className="rowlink" href={`/admin/products/${encodeURIComponent(p.id)}`}>{p.name}</Link><div className="small muted mono">{p.id}</div></td>
                    <td>{p.cat}</td>
                    <td className="num">{rs(p.price)}</td>
                    <td className="num" style={low ? { color: p.stock === 0 ? "var(--bad)" : "var(--warn)", fontWeight: 600 } : undefined}>
                      {pcs(p.stock, p.carton)}
                      <div className="small muted">{p.carton} / carton</div>
                    </td>
                    <td><StockAdjust id={p.id} carton={p.carton} /></td>
                    <td>
                      <ActionButton
                        action={setProductActive.bind(null, p.id, !p.active)}
                        label={p.active ? "Hide" : "Show"}
                        className={"b sm" + (p.active ? " ghost" : "")}
                      />
                      {!p.active && <div className="small muted">Hidden</div>}
                    </td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={7} className="empty">No products match.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
