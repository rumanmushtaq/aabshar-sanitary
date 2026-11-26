import { STAGES } from "@/lib/data";
import { dateStr, getT, rs } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n/config";
import type { DealerOrder } from "./data";

/** One dealer order with its stage progress. No hooks, so server and client screens can both use it. */
export function OrderRow({ o, lang }: { o: DealerOrder; lang: Lang }) {
  const t = getT(lang);
  return (
    <div className="orow">
      <div>
        <b className="mono" dir="ltr">{o.no}</b>
        <small>
          <span>{dateStr(o.day, lang)}</span> · <span className="mono">{o.items}</span> <span>{t(o.items === 1 ? "item" : "items")}</span> · <span className="mono">{o.cartons}</span> <span>{t("cartons")}</span> · <span className="mono">{rs(o.total, lang)}</span>
        </small>
      </div>
      {o.stage < 0 ? (
        <span style={{ justifySelf: "end", color: "#b3261e", fontWeight: 600, fontSize: ".85rem" }}>{t("Cancelled")}</span>
      ) : (
        <ol className="ostage">
          {STAGES.map((s, i) => (
            <li key={s} className={i <= o.stage ? "on" : ""}><i /><span>{t(s)}</span></li>
          ))}
        </ol>
      )}
    </div>
  );
}
