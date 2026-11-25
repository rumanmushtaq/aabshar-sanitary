"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useI18n, useShop } from "@/components/providers";
import { Pic } from "@/components/product/pic";
import { BY, CATALOG } from "@/lib/data";
import { unitPrice } from "@/lib/pricing";
import { dealerCats } from "./data";

const CATS = dealerCats();
const SLABS = ["1–4", "5–19", "20+"];

/** Dealer price list with carton steppers. Cartons are added to the cart in pieces. */
export function QuickOrder({ initialCat }: { initialCat: string }) {
  const { t, rs } = useI18n();
  const { addItem, openOverlay, toast } = useShop();
  const [cat, setCat] = useState(initialCat);
  /** Cartons chosen per product id. */
  const [cartons, setCartons] = useState<Record<string, number>>({});
  const { register, control } = useForm<{ q: string }>({ defaultValues: { q: "" } });
  const q = useWatch({ control, name: "q" }).trim().toLowerCase();

  const rows = CATALOG.filter(
    (p) => (cat === "All" || p.cat === cat) && (!q || (p.name + " " + p.id + " " + t(p.name)).toLowerCase().includes(q)),
  );

  let ctn = 0;
  let total = 0;
  for (const [id, n] of Object.entries(cartons)) {
    if (!n) continue;
    const p = BY[id];
    ctn += n;
    total += unitPrice(p, p.fins[0] ?? "", n * p.carton, "dealer") * n * p.carton;
  }

  const step = (id: string, d: number) => setCartons((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + d) }));

  const addAll = () => {
    let n = 0;
    for (const [id, c] of Object.entries(cartons)) {
      if (!c) continue;
      addItem(id, undefined, c * BY[id].carton, true);
      n += c;
    }
    setCartons({});
    openOverlay("cart");
    toast(`${n} cartons added to your order`);
  };

  return (
    <>
      <div className="qtools">
        <div className="chips">
          {CATS.map((c) => (
            <button key={c} type="button" aria-pressed={c === cat} onClick={() => setCat(c)}>{t(c)}</button>
          ))}
        </div>
        <label htmlFor="dq-s" className="sr-only">{t("Search products")}</label>
        <input id="dq-s" className="qsearch" placeholder={t("Search by name or SKU")} {...register("q")} />
      </div>

      <div className="qtable" role="table" aria-label={t("Price list")}>
        <div className="qr qh" role="row">
          <span role="columnheader">{t("Product")}</span>
          <span role="columnheader">{t("Pack")}</span>
          {SLABS.map((s) => <span key={s} role="columnheader">{s}</span>)}
          <span role="columnheader">{t("Order")}</span>
        </div>
        {rows.map((p) => {
          const n = cartons[p.id] ?? 0;
          const k = n >= 20 ? 2 : n >= 5 ? 1 : 0;
          const name = t(p.name);
          return (
            <div className="qr" role="row" key={p.id}>
              <span className="qp" role="cell">
                <Pic p={p} alt="" sizes="48px" />
                <span><b>{name}</b><small className="mono">{p.id}</small></span>
              </span>
              <span role="cell" className="qpack"><span className="mono">{p.carton}</span> <span>{t("pcs")}</span></span>
              {p.slabs.map((v, j) => (
                <span key={j} role="cell" className={"mono qsl" + (n && j === k ? " on" : "")}>
                  <small className="ql">{SLABS[j]}</small>
                  {Math.round(v).toLocaleString("en-PK")}
                </span>
              ))}
              <span role="cell" className="qn">
                <span className="step-q">
                  <button type="button" aria-label={t("Fewer") + " · " + name} onClick={() => step(p.id, -1)}>−</button>
                  <span className="mono" aria-live="polite">{n}</span>
                  <button type="button" aria-label={t("More") + " · " + name} onClick={() => step(p.id, 1)}>+</button>
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="qfoot">
        <span><b className="mono">{ctn}</b> <span>{t("cartons")}</span> · <b className="mono">{rs(total)}</b></span>
        <button className="btn dark" type="button" disabled={!ctn} onClick={addAll}>{t("Add to order")}</button>
      </div>
    </>
  );
}
