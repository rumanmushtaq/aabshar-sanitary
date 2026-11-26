import type { Metadata } from "next";
import { getSettings, requireStaff } from "@/lib/admin-data";
import { NoAccess, PageHead } from "@/components/admin/bits";
import { PromoHead, PromoRow, RateHead, RateRow, ShopHead, ShopRow } from "@/components/admin/settings-forms";
import { isoDay } from "@/components/admin/format";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireStaff();
  if (me.role !== "admin") return (<><PageHead title="Settings" /><NoAccess /></>);
  const { rates, shops, promos } = await getSettings();
  return (
    <>
      <PageHead title="Settings" sub="Changes show in the shop on the next page load." />
      <div className="stack">
        <section className="card flush">
          <h2 className="h">Delivery rates</h2>
          <p className="small muted" style={{ margin: "0 16px 8px" }}>Cities customers can choose at checkout. “Free over threshold” waives the fee on large orders.</p>
          <RateHead />
          {rates.map((r) => <RateRow key={r.city} value={{ city: r.city, days: r.days, fee: r.fee, freeOver: r.freeOver }} />)}
          <RateRow />
        </section>

        <section className="card flush">
          <h2 className="h">Promo codes</h2>
          <p className="small muted" style={{ margin: "0 16px 8px" }}>Codes are stored in capitals. 1 to 50% off. A code works until the end of its expiry day.</p>
          <PromoHead />
          {promos.map((p) => <PromoRow key={p.code} value={{ code: p.code, pct: p.pct, active: p.active, expires: p.expiresAt ? isoDay(p.expiresAt) : "" }} />)}
          <PromoRow />
        </section>

        <section className="card flush">
          <h2 className="h">Dealer shops (“Find a dealer”)</h2>
          <p className="small muted" style={{ margin: "0 16px 8px" }}>Grouped by city on the homepage; lower sort shows first.</p>
          <ShopHead />
          {shops.map((s) => <ShopRow key={s.id} value={{ id: s.id, city: s.city, name: s.name, area: s.area, phone: s.phone, sort: s.sort }} />)}
          <ShopRow />
        </section>
      </div>
    </>
  );
}
