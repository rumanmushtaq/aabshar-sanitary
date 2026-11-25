"use client";

import { useState } from "react";
import { BY, TANKS } from "@/lib/data";
import { useI18n, useShop } from "@/components/providers";

/** Tank size finder: people at home to tank size, with price and add to cart. */
export function TankFinder() {
  const { t, rs } = useI18n();
  const { mode, addItem } = useShop();
  const [k, setK] = useState(1);
  const tank = TANKS[k];
  const p = BY[tank.id];
  const litres = Math.round(tank.g * 4.546).toLocaleString("en-PK");
  return (
    <div className="tankf rise" id="tankf">
      <span className="eyebrow" style={{ color: "var(--brass)" }}>{t("Tank size finder")}</span>
      <h3>{t("How many people live in your home?")}</h3>
      <div className="tpick" role="group" aria-label={t("People at home")} id="tpick">
        {TANKS.map((x, i) => (
          <button key={x.id} type="button" aria-pressed={i === k} onClick={() => setK(i)}>
            {x.p}<small>{t("people")}</small>
          </button>
        ))}
      </div>
      <div className="tout" aria-live="polite">
        <span className="big mono" id="tf-gal">{tank.g.toLocaleString("en-PK")}</span>
        <span className="u">{t("gallons")}</span>
        <span className="tsub" id="tf-sub">{t(`${litres} litres · ${p.name.split(",")[0]}`)}</span>
      </div>
      <div className="tmeter" aria-hidden="true"><i id="tf-bar" style={{ width: (tank.g / 1500) * 100 + "%" }} /></div>
      <div className="trow">
        <span className="mono" id="tf-price">{mode === "dealer" ? t(rs(p.slabs[0]) + " dealer") : rs(p.price)}</span>
        <button className="btn brass" type="button" id="tf-add" onClick={() => addItem(tank.id, undefined, 1)}>{t("Add this tank")}</button>
      </div>
      <small className="tnote">{t("Based on one full day of water. Pick one size up if your supply comes every other day.")}</small>
    </div>
  );
}
