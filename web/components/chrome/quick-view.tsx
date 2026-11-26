"use client";

import { useState } from "react";
import Link from "next/link";
import { useCatalog, useI18n, useShop } from "@/components/providers";
import { FIN, type FinishId } from "@/lib/data";
import { productText } from "@/lib/i18n";
import { openWhatsApp } from "@/lib/contact";
import { soldOut } from "@/components/product/catalog";
import { finWord, packOf, slabLabels } from "@/lib/pricing";
import { Pic } from "@/components/product/pic";
import { CloseIcon } from "@/components/icons";

/** Body of the quick view modal (v7 renderQV). Remount with a new key to reset finish and quantity. */
export function QuickView({ id, onClose, onLeave }: { id: string; onClose: () => void; onLeave: () => void }) {
  const { t, rs, href, lang } = useI18n();
  const { mode, addItem, openOverlay } = useShop();
  const { BY } = useCatalog();
  const p = BY[id];
  const txt = productText(p, lang);
  const out = soldOut(p);
  const stock = p.stock ?? Infinity;
  const dealer = mode === "dealer";
  const step = dealer ? p.carton : 1;
  const [fin, setFin] = useState<FinishId | "">(p.fins.includes("chrome") ? "chrome" : (p.fins[0] ?? ""));
  const [qty, setQty] = useState(step);
  const m = fin ? FIN[fin].mult : 1;
  const n = qty / p.carton;

  const price = dealer ? (
    <>
      <div className="slab" style={{ display: "grid" }}>
        {slabLabels(p).map((l, k) => (
          <div key={l}><span>{t(l)}</span><b>{Math.round(p.slabs[k] * m).toLocaleString("en-PK")}</b></div>
        ))}
      </div>
      <span className="note">{t(p.carton > 1 ? `Per piece · ${packOf(p)} of ${p.carton}` : "Per piece · price drops at 5 and 20")}</span>
    </>
  ) : (
    <>
      <div className="price" style={{ display: "flex" }}>
        <span className="now" style={{ fontSize: "1.5rem" }}>{rs(p.price * m)}</span>
        {p.was > 0 && <span className="was">{rs(p.was * m)}</span>}
      </div>
      <span className="note">{[txt.sub, t("Cash on Delivery"), t(p.wty ?? "10-year warranty")].filter((s): s is string => !!s).join(" · ")}</span>
    </>
  );

  return (
    <div className="qvg">
      <div className="qvimg">
        <Pic p={p} big alt={txt.name} sizes="(max-width: 760px) 100vw, 490px" />
      </div>
      <div className="qvinfo">
        <button className="x" type="button" aria-label={t("Close")} onClick={onClose}><CloseIcon /></button>
        <span className="eyebrow" style={{ color: "var(--brass-text)" }}>{t(p.cat)} · {p.id}</span>
        <h2 id="qv-title">{txt.name}</h2>
        {price}
        {fin && (
          <div style={{ display: "grid", gap: 8 }}>
            <span className="note">{t((finWord(p) === "colour" ? "Colour" : "Finish") + " · " + FIN[fin].label)}</span>
            <div className="chips">
              {p.fins.map((f) => (
                <button key={f} type="button" aria-pressed={f === fin} onClick={() => setFin(f)}>
                  <span className={"sw " + f} />
                  {t(FIN[f].label)}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span className="step-q" style={{ margin: 0 }}>
            <button type="button" aria-label={t("Fewer")} onClick={() => setQty((q) => Math.max(step, q - step))}>−</button>
            <span>{qty}</span>
            <button type="button" aria-label={t("More")} disabled={out || qty + step > stock} onClick={() => setQty((q) => q + step)}>+</button>
          </span>
          <button
            className="btn dark"
            type="button"
            style={{ flex: 1 }}
            disabled={out}
            onClick={() => {
              addItem(p.id, fin, qty, true);
              openOverlay("cart");
            }}
          >
            {out ? t("Out of stock") : t(dealer ? (p.carton > 1 ? `Add ${n} ${packOf(p)}${n > 1 ? "s" : ""}` : `Add ${qty} pcs`) : "Add to cart")}
          </button>
        </div>
        <ul className="specs">
          {txt.specs.map((s) => <li key={s}>{s}</li>)}
        </ul>
        <div className="qvlinks">
          <Link className="link" href={href("/p/" + p.id)} onClick={onLeave}>{t("Full details")}</Link>
          <button className="btn wa" type="button" onClick={() => openWhatsApp(t("Assalam o Alaikum. I want to ask about this:") + "\n" + p.id + " " + txt.name + "\n" + location.origin + href("/p/" + p.id))}>
            {t("Ask about this on WhatsApp")}
          </button>
        </div>
      </div>
    </div>
  );
}
