import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dateStr, getT, rs } from "@/lib/i18n";
import { hasLang, type Lang } from "@/lib/i18n/config";
import { getKhata } from "@/lib/dealer-data";
import { DownloadIcon } from "@/components/checkout/icons";
import { ToastButton } from "@/components/dealer/actions";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  return { title: getT(lang)("Khata"), robots: { index: false } };
}

export default async function DealerKhata({ params }: Props) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  return (
    <Suspense fallback={<div className="kpis three" />}>
      <Khata lang={lang} />
    </Suspense>
  );
}

async function Khata({ lang }: { lang: Lang }) {
  const k = await getKhata();
  if (!k) return null; // signed out: the layout shows the sign-in gate
  const t = getT(lang);
  const money = (n: number) => (n ? rs(n, lang) : "—");
  const rows = [...k.rows].reverse(); // newest first

  return (
    <>
      <div className="kpis three">
        <div className="kpi">
          <span>{t("Balance due")}</span>
          <b className="mono">{rs(k.balance, lang)}</b>
          <small>{k.due ? <><span>{t("Due")}</span> {dateStr(k.due, lang)}</> : t("Nothing due")}</small>
        </div>
        <div className="kpi">
          <span>{t("Available credit")}</span>
          <b className="mono ok">{rs(Math.max(0, k.available), lang)}</b>
          <small><span>{t("Limit")}</span> <span className="mono">{rs(k.limit, lang)}</span></small>
        </div>
        <div className="kpi">
          <span>{t("Pay now")}</span>
          <div className="paybtns">
            <ToastButton className="btn dark" msg="Opens Bank transfer payment in the live site">{t("Bank transfer")}</ToastButton>
            <ToastButton className="btn line" msg="Opens JazzCash payment in the live site">{t("JazzCash")}</ToastButton>
          </div>
        </div>
      </div>
      <div className="dcard">
        <div className="dch">
          <h3>{t("Khata ledger")}</h3>
          <a className="btn line sm" href={`/api/dealer/statement?lang=${lang}`} download>
            <DownloadIcon /><span>{t("Download statement")}</span>
          </a>
        </div>
        <div className="ltable" role="table" aria-label={t("Khata ledger")}>
          <div className="lr lh" role="row">
            {["Date", "Reference", "Detail", "Debit", "Credit", "Balance"].map((h) => (
              <span key={h} role="columnheader">{t(h)}</span>
            ))}
          </div>
          {rows.map((r, i) => (
            <div className="lr" role="row" key={r.ref + i}>
              <span role="cell">{dateStr(r.day, lang)}</span>
              <span role="cell" className="mono" dir="ltr">{r.ref}</span>
              <span role="cell">{t(r.detail)}</span>
              <span role="cell" className="mono">{money(r.debit)}</span>
              <span role="cell" className="mono ok">{money(r.credit)}</span>
              <span role="cell" className="mono"><b>{rs(r.balance, lang)}</b></span>
            </div>
          ))}
          {!rows.length && <p className="note">{t("No entries yet")}</p>}
        </div>
      </div>
    </>
  );
}
