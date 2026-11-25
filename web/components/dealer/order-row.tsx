import { STAGES, type ORDERS } from "@/lib/data";
import { dateStr, getT, rs } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n/config";

/** One dealer order with its stage progress. No hooks, so server and client screens can both use it. */
export function OrderRow({ o, lang }: { o: (typeof ORDERS)[number]; lang: Lang }) {
  const t = getT(lang);
  return (
    <div className="orow">
      <div>
        <b className="mono" dir="ltr">{o.no}</b>
        <small>
          <span>{dateStr(o.date, lang)}</span> · <span className="mono">{o.cartons}</span> <span>{t("cartons")}</span> · <span className="mono">{rs(o.total, lang)}</span>
        </small>
      </div>
      <ol className="ostage">
        {STAGES.map((s, i) => (
          <li key={s} className={i <= o.st ? "on" : ""}><i /><span>{t(s)}</span></li>
        ))}
      </ol>
    </div>
  );
}
