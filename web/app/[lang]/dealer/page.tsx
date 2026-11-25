import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY, DEALER, LAST, ORDERS } from "@/lib/data";
import { dateStr, getT, href, rs } from "@/lib/i18n";
import { hasLang } from "@/lib/i18n/config";
import { packOf } from "@/lib/pricing";
import { Pic } from "@/components/product/pic";
import { WhatsAppIcon } from "@/components/icons";
import { OrderRow } from "@/components/dealer/order-row";
import { DaysLeft, ReorderButton, ToastButton } from "@/components/dealer/actions";
import { AVAILABLE, monthBuy } from "@/components/dealer/data";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  return { title: getT(lang)("Dealer portal"), robots: { index: false } };
}

export default async function DealerOverview({ params }: Props) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  const t = getT(lang);
  const pct = (DEALER.used / DEALER.limit) * 100;
  const bought = monthBuy();
  const lastNo = ORDERS[0]?.no;
  const lastSum = LAST.reduce((a, [id, n]) => a + BY[id].slabs[1] * BY[id].carton * n, 0);

  return (
    <>
      <div className="kpis">
        <div className="kpi wide">
          <span>{t("Credit used")}</span>
          <b className="mono">{rs(DEALER.used, lang)}</b>
          <div className="bar"><i style={{ width: pct + "%" }} /></div>
          <small>
            <span>{t("Available")}</span> <b className="mono">{rs(AVAILABLE, lang)}</b> · <span>{t("Limit")}</span> <span className="mono">{rs(DEALER.limit, lang)}</span>
          </small>
        </div>
        <div className="kpi">
          <span>{t("Next payment due")}</span>
          <b>{dateStr(DEALER.due, lang)}</b>
          <small><DaysLeft /> <span>{t("days left")}</span></small>
        </div>
        <div className="kpi">
          <span>{t("Bought this month")}</span>
          <b className="mono">{rs(bought, lang)}</b>
          <small><span>{t("Tier B")}</span> · <span>{t("Tier A from Rs 25 lakh a month")}</span></small>
        </div>
        <div className="kpi">
          <span>{t("Saved vs retail")}</span>
          <b className="mono ok">{rs(Math.round(bought * 0.27), lang)}</b>
          <small>{t("This month, on slab prices")}</small>
        </div>
      </div>

      <div className="dgrid">
        <div className="dcard">
          <div className="dch">
            <h3>{t("Reorder your last order")}</h3>
            <span className="note"><span className="mono" dir="ltr">{lastNo}</span></span>
          </div>
          {LAST.map(([id, n]) => {
            const p = BY[id];
            return (
              <div className="line" key={id}>
                <Pic p={p} alt="" sizes="72px" />
                <div>
                  <b>{t(p.name)}</b>
                  <small className="mono">{p.id}</small>
                  <br />
                  <small><span className="mono">{n}</span> <span>{t(p.carton > 1 ? packOf(p) + "s" : "pcs")}</span></small>
                </div>
                <span className="mono">{rs(p.slabs[1] * p.carton * n, lang)}</span>
              </div>
            );
          })}
          <div className="sum" style={{ marginTop: 12 }}>
            <span>{t("Total")}</span><span className="mono">{rs(lastSum, lang)}</span>
          </div>
          <ReorderButton label={t("Reorder all on credit")} />
        </div>

        <div className="dcol">
          <div className="dcard">
            <div className="dch">
              <h3>{t("Recent orders")}</h3>
              <Link href={href("/dealer/orders", lang)}>{t("See all")}</Link>
            </div>
            {ORDERS.slice(0, 3).map((o) => <OrderRow key={o.no} o={o} lang={lang} />)}
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
              <span className="av">{lang === "ur" ? "ب" : "B"}</span>
              <span><b>{t(DEALER.manager)}</b><small className="mono" dir="ltr">0300 000 0000</small></span>
              <ToastButton className="btn wa" msg="Opens WhatsApp chat: 0300 000 0000">
                <WhatsAppIcon /><span>{t("WhatsApp")}</span>
              </ToastButton>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
