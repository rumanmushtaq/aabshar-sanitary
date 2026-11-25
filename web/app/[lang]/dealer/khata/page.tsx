import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEALER } from "@/lib/data";
import { dateStr, getT, rs } from "@/lib/i18n";
import { hasLang } from "@/lib/i18n/config";
import { DownloadIcon } from "@/components/checkout/icons";
import { ToastButton } from "@/components/dealer/actions";
import { AVAILABLE, ledgerRows } from "@/components/dealer/data";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  return { title: getT(lang)("Khata"), robots: { index: false } };
}

export default async function DealerKhata({ params }: Props) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  const t = getT(lang);
  const money = (n: number) => (n ? rs(n, lang) : "—");

  return (
    <>
      <div className="kpis three">
        <div className="kpi">
          <span>{t("Balance due")}</span>
          <b className="mono">{rs(DEALER.used, lang)}</b>
          <small><span>{t("Due")}</span> {dateStr(DEALER.due, lang)}</small>
        </div>
        <div className="kpi">
          <span>{t("Available credit")}</span>
          <b className="mono ok">{rs(AVAILABLE, lang)}</b>
          <small><span>{t("Limit")}</span> <span className="mono">{rs(DEALER.limit, lang)}</span></small>
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
          <ToastButton className="btn line sm" msg="Downloads a PDF in the live site">
            <DownloadIcon /><span>{t("Download statement")}</span>
          </ToastButton>
        </div>
        <div className="ltable" role="table" aria-label={t("Khata ledger")}>
          <div className="lr lh" role="row">
            {["Date", "Reference", "Detail", "Debit", "Credit", "Balance"].map((h) => (
              <span key={h} role="columnheader">{t(h)}</span>
            ))}
          </div>
          {ledgerRows().map((r) => (
            <div className="lr" role="row" key={r.ref}>
              <span role="cell">{dateStr(r.d, lang)}</span>
              <span role="cell" className="mono" dir="ltr">{r.ref}</span>
              <span role="cell">{t(r.detail)}</span>
              <span role="cell" className="mono">{money(r.dr)}</span>
              <span role="cell" className="mono ok">{money(r.cr)}</span>
              <span role="cell" className="mono"><b>{rs(r.bal, lang)}</b></span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
