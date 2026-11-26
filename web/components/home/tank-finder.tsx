"use client";

import { useState } from "react";
import { TANKS } from "@/lib/data";
import { productText } from "@/lib/i18n";
import { soldOut } from "@/components/product/catalog";
import { useCatalog, useI18n, useShop } from "@/components/providers";

/** Tank size finder: people at home to tank size, with price and add to cart. */
export function TankFinder() {
  const { t, rs, lang } = useI18n();
  const { mode, addItem } = useShop();
  const { BY } = useCatalog();
  const tanks = TANKS.filter((x) => BY[x.id]);
  const [kState, setK] = useState(1);
  if (!tanks.length) return null;
  const k = Math.min(kState, tanks.length - 1);
  const tank = tanks[k];
  const p = BY[tank.id];
  const out = soldOut(p);
  const litres = Math.round(tank.g * 4.546).toLocaleString("en-PK");
  return (
    <div className="tankf rise" id="tankf">
      <span className="eyebrow" style={{ color: "var(--brass)" }}>{t("Tank size finder")}</span>
      <h3>{t("How many people live in your home?")}</h3>
      <div className="tpick" role="group" aria-label={t("People at home")} id="tpick">
        {tanks.map((x, i) => (
          <button key={x.id} type="button" aria-pressed={i === k} onClick={() => setK(i)}>
            {x.p}<small>{t("people")}</small>
          </button>
        ))}
      </div>
      <div className="tout" aria-live="polite">
        <span className="big mono" id="tf-gal">{tank.g.toLocaleString("en-PK")}</span>
        <span className="u">{t("gallons")}</span>
        <span className="tsub" id="tf-sub">{t(`${litres} litres`)} · {productText(p, lang).name.split(/[,،]/)[0]}</span>
      </div>
      <div className="tmeter" aria-hidden="true"><i id="tf-bar" style={{ width: (tank.g / 1500) * 100 + "%" }} /></div>
      <div className="trow">
        <span className="mono" id="tf-price">{mode === "dealer" ? t(rs(p.slabs[0]) + " dealer") : rs(p.price)}</span>
        <button className="btn brass" type="button" id="tf-add" disabled={out} onClick={() => addItem(tank.id, undefined, 1)}>{t(out ? "Out of stock" : "Add this tank")}</button>
      </div>
      <small className="tnote">{t("Based on one full day of water. Pick one size up if your supply comes every other day.")}</small>
    </div>
  );
}
