import { Suspense } from "react";
import type { Metadata } from "next";
import { PHONE, waLink } from "@/lib/contact";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { FinishId } from "@/lib/data";
import { dateStr, getT, href, productText, rs } from "@/lib/i18n";
import { hasLang, type Lang } from "@/lib/i18n/config";
import { packOf, unitPrice } from "@/lib/pricing";
import { getCatalog } from "@/lib/store";
import { getOverview } from "@/lib/dealer-data";
import { Pic } from "@/components/product/pic";
import { WhatsAppIcon } from "@/components/icons";
import { OrderRow } from "@/components/dealer/order-row";
import { DaysLeft, ReorderButton } from "@/components/dealer/actions";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  return { title: getT(lang)("Dealer portal"), robots: { index: false } };
}

export default async function DealerOverview({ params }: Props) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  return (
    <Suspense fallback={<div className="kpis" />}>
      <Overview lang={lang} />
    </Suspense>
  );
}

async function Overview({ lang }: { lang: Lang }) {
  const [o, catalog] = await Promise.all([getOverview(), getCatalog()]);
  if (!o) return null; // signed out: the layout shows the sign-in gate
  const t = getT(lang);
  const by = Object.fromEntries(catalog.map((p) => [p.id, p]));
  const pct = Math.min(100, Math.max(0, (o.balance / o.limit) * 100));
  const manager = t(o.dealer.manager);

  // Last order's lines at today's catalogue: dealer slab price for the same quantity.
  const lines = (o.last?.lines ?? []).map((l) => {
    const p = by[l.id];
    if (!p) return { ...l, p, sum: 0 };
    const fin = p.fins.includes(l.fin as FinishId) ? (l.fin as FinishId) : (p.fins[0] ?? "");
    return { ...l, p, sum: unitPrice(p, fin, l.qty, "dealer") * l.qty };
  });
  const lastSum = lines.reduce((a, l) => a + l.sum, 0);

  return (
    <>
      <div className="kpis">
        <div className="kpi wide">
          <span>{t("Credit used")}</span>
          <b className="mono">{rs(o.balance, lang)}</b>
          <div className="bar"><i style={{ width: pct + "%" }} /></div>
          <small>
            <span>{t("Available")}</span> <b className="mono">{rs(Math.max(0, o.available), lang)}</b> · <span>{t("Limit")}</span> <span className="mono">{rs(o.limit, lang)}</span>
          </small>
        </div>
        <div className="kpi">
          <span>{t("Next payment due")}</span>
          {o.due ? (
            <>
              <b>{dateStr(o.due, lang)}</b>
              <small><DaysLeft due={o.due} /> <span>{t("days left")}</span></small>
            </>
          ) : (
            <b>{t("Nothing due")}</b>
          )}
        </div>
        <div className="kpi">
          <span>{t("Bought this month")}</span>
          <b className="mono">{rs(o.bought, lang)}</b>
          <small>
            <span>{t("Tier " + o.dealer.tier)}</span>
            {o.dealer.tier !== "A" && <> · <span>{t("Tier A from Rs 25 lakh a month")}</span></>}
          </small>
        </div>
        <div className="kpi">
          <span>{t("Saved vs retail")}</span>
          <b className="mono ok">{rs(o.saved, lang)}</b>
          <small>{t("This month, on slab prices")}</small>
        </div>
      </div>

      <div className="dgrid">
        <div className="dcard">
          <div className="dch">
            <h3>{t("Reorder your last order")}</h3>
            {o.last && <span className="note"><span className="mono" dir="ltr">{o.last.no}</span></span>}
          </div>
          {!o.last && <p className="note">{t("No orders yet")}</p>}
          {lines.map(({ id, name, qty, p, sum }, i) => {
            if (!p) {
              return (
                <div className="line" key={id + i}>
                  <span />
                  <div>
                    <b>{t(name)}</b>
                    <small className="mono">{id}</small>
                    <br />
                    <small>{t("No longer sold")}</small>
                  </div>
                  <span className="mono">—</span>
                </div>
              );
            }
            const packs = p.carton > 1 && qty % p.carton === 0;
            return (
              <div className="line" key={id + i}>
                <Pic p={p} alt="" sizes="72px" />
                <div>
                  <b>{productText(p, lang).name}</b>
                  <small className="mono">{p.id}</small>
                  <br />
                  <small><span className="mono">{packs ? qty / p.carton : qty}</span> <span>{t(packs ? packOf(p) + "s" : "pcs")}</span></small>
                </div>
                <span className="mono">{rs(sum, lang)}</span>
              </div>
            );
          })}
          {o.last && (
            <>
              <div className="sum" style={{ marginTop: 12 }}>
                <span>{t("Total")}</span><span className="mono">{rs(lastSum, lang)}</span>
              </div>
              <ReorderButton label={t("Reorder all on credit")} lines={o.last.lines.map(({ id, fin, qty }) => ({ id, fin, qty }))} />
            </>
          )}
        </div>

        <div className="dcol">
          <div className="dcard">
            <div className="dch">
              <h3>{t("Recent orders")}</h3>
              <Link href={href("/dealer/orders", lang)}>{t("See all")}</Link>
            </div>
            {o.recent.map((r) => <OrderRow key={r.no} o={r} lang={lang} />)}
            {!o.recent.length && <p className="note">{t("No orders yet")}</p>}
          </div>
          <div className="dcard dark">
            <span className="eyebrow" style={{ color: "var(--brass)" }}>{t("New for dealers")}</span>
            <h3>{t("Plastic water tanks now on credit")}</h3>
            <p>{t("Order 500 and 1000 gallon tanks with your fittings. Same truck, same khata.")}</p>
            <Link className="btn brass" href={href("/dealer/order?cat=" + encodeURIComponent("Water Tanks"), lang)}>{t("Order tanks")}</Link>
          </div>
          <div className="dcard">
            <div className="dch"><h3>{t("Your area manager")}</h3></div>
            <p className="mgr">
              <span className="av">{manager.trim().charAt(0)}</span>
              <span><b>{manager}</b><small className="mono" dir="ltr">{PHONE}</small></span>
              <a className="btn wa" href={waLink()} target="_blank" rel="noreferrer">
                <WhatsAppIcon /><span>{t("WhatsApp")}</span>
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
