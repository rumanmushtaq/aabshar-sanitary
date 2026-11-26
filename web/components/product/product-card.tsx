"use client";

import Image from "next/image";
import Link from "next/link";
import { FIN, type Product } from "@/lib/data";
import { finWord, packOf, slabLabels } from "@/lib/pricing";
import { useI18n, useShop } from "@/components/providers";
import { productText } from "@/lib/i18n";
import { Pic } from "./pic";
import { soldOut } from "./catalog";
import { EyeIcon } from "@/components/icons";
import "./shop.css";

/** Product tile used in rails and grids. Shows retail or dealer slab prices from the body class. */
export function ProductCard({ p }: { p: Product }) {
  const { t, rs, href, lang } = useI18n();
  const { addItem, quickView } = useShop();
  const txt = productText(p, lang);
  const out = soldOut(p);
  const word = finWord(p);
  const finCount = p.fins.length + " " + word + (p.fins.length > 1 ? (word === "colour" ? "s" : "es") : "");
  const sizes = "(max-width: 760px) 50vw, 25vw";
  return (
    <article className="card rise">
      <div className="pic">
        <Pic p={p} big sizes={sizes} alt={txt.name} />
        {p.alt && <Image className="alt" src={p.alt} alt="" width={800} height={1000} sizes={sizes} />}
        {p.flag && <span className={"flag" + (p.sale ? " sale" : "")}>{t(p.flag)}</span>}
        <button className="qv" type="button" aria-label={t("Quick view:") + " " + txt.name} onClick={() => quickView(p.id)}>
          <EyeIcon />
        </button>
        {out ? (
          <button className="quick" type="button" disabled>{t("Out of stock")}</button>
        ) : (
          <button className="quick" type="button" onClick={() => addItem(p.id)}>
            <span data-show="retail">{t("Add to cart")}</span>
            <span data-show="dealer">{t(p.carton > 1 ? `Add 1 ${packOf(p)} · ${p.carton} pcs` : `Add 1 ${packOf(p)}`)}</span>
          </button>
        )}
      </div>
      <div className="meta">
        <span className="sku">{p.id}</span>
        <h3>
          <Link href={href("/p/" + p.id)} style={{ textDecoration: "none" }}>{txt.name}</Link>
        </h3>
        <div className="fins">
          {p.fins.map((f) => <span key={f} className={"sw " + f} title={t(FIN[f].label)} />)}
          <span>{txt.sub ?? t(finCount)}</span>
        </div>
        <div className="price" data-show="retail">
          <span className="now">{rs(p.price)}</span>
          {p.was > 0 && <span className="was">{rs(p.was)}</span>}
        </div>
        <div className="slab" data-show="dealer">
          {slabLabels(p).map((l, k) => (
            <div key={l}><span>{t(l)}</span><b>{p.slabs[k].toLocaleString("en-PK")}</b></div>
          ))}
        </div>
        <span className="note" data-show="dealer">{t(p.carton > 1 ? `Per piece · ${packOf(p)} of ${p.carton}` : "Per piece · min 1")}</span>
      </div>
    </article>
  );
}
