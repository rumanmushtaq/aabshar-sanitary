"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FIN, type FinishId, type Product } from "@/lib/data";
import { packOf, slabLabels } from "@/lib/pricing";
import { useI18n, useShop } from "@/components/providers";
import { productText } from "@/lib/i18n";
import { Pic } from "./pic";
import { LOW_STOCK, soldOut } from "./catalog";
import { BagIcon, EyeIcon } from "@/components/icons";
import "./card.css";

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
);
const TickIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);

/**
 * Product tile for rails and grids. Finish swatches can be picked here and change the price and what
 * "Add" puts in the cart. Retail and dealer prices are both rendered; the body class shows one.
 */
export function ProductCard({ p }: { p: Product }) {
  const { t, rs, href, lang } = useI18n();
  const { addItem, quickView } = useShop();
  const txt = productText(p, lang);
  const out = soldOut(p);
  const low = !out && p.stock != null && p.stock < LOW_STOCK;
  // Start on the lowest-priced finish, so the card shows the "from" price.
  const [fin, setFin] = useState<FinishId | "">(() => [...p.fins].sort((a, b) => FIN[a].mult - FIN[b].mult)[0] ?? "");
  const mult = fin ? FIN[fin].mult : 1;
  const price = (n: number) => Math.round(n * mult);
  const off = p.was > p.price ? Math.round((1 - p.price / p.was) * 100) : 0;

  // Brief "Added" state on the button after a tap.
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const add = () => {
    addItem(p.id, fin);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  };

  const link = href("/p/" + p.id);
  const sizes = "(max-width: 760px) 50vw, (max-width: 1600px) 25vw, 20vw";
  const dealerAdd = t(p.carton > 1 ? `Add 1 ${packOf(p)} · ${p.carton} pcs` : `Add 1 ${packOf(p)}`);

  return (
    <article className={"pc rise" + (out ? " is-out" : "")}>
      <div className="pc-media">
        <Link href={link} className="pc-img" tabIndex={-1} aria-hidden="true">
          <Pic p={p} big sizes={sizes} alt="" />
          {p.alt && <Image className="pc-alt" src={p.alt} alt="" width={800} height={1000} sizes={sizes} />}
        </Link>

        <div className="pc-badges">
          {p.flag && <span className={"pc-flag" + (p.sale ? " sale" : "")}>{t(p.flag)}</span>}
          {off > 0 && !p.flag?.includes("%") && <span className="pc-flag sale mono" dir="ltr">−{off}%</span>}
          {out && <span className="pc-flag out">{t("Out of stock")}</span>}
          {low && <span className="pc-flag low">{t("Only")} <span className="mono">{p.stock}</span> {t("left in stock")}</span>}
        </div>

        <button className="pc-qv" type="button" aria-label={t("Quick view:") + " " + txt.name} onClick={() => quickView(p.id)}>
          <EyeIcon />
        </button>

        {/* Details panel: slides up over the photo on hover or keyboard focus (mouse devices only). */}
        <div className="pc-hover">
          {txt.specs.length > 0 && (
            <ul className="pc-specs">
              {txt.specs.slice(0, 3).map((s) => <li key={s}><TickIcon /><span>{s}</span></li>)}
            </ul>
          )}
          <div className="pc-facts">
            {p.wty && <span>{t(p.wty)}</span>}
            <span>{t(p.carton > 1 ? `${p.carton} pcs per ${packOf(p)}` : "min 1")}</span>
            {p.fins.length > 1 && <span>{t(`${p.fins.length} ${p.id.startsWith("AP-") ? "colours" : "finishes"}`)}</span>}
          </div>
          <div className="pc-actions">
            {out ? (
              <span className="pc-add-full is-off">{t("Out of stock")}</span>
            ) : (
              <button className={"pc-add-full" + (added ? " done" : "")} type="button" onClick={add}>
                {added ? <TickIcon /> : <BagIcon />}
                <span data-show="retail">{added ? t("Added") : t("Add to cart")}</span>
                <span data-show="dealer">{added ? t("Added") : dealerAdd}</span>
              </button>
            )}
            <Link className="pc-more" href={link}>{t("Full details")}</Link>
          </div>
        </div>

        {/* Touch screens have no hover: a round add button stays on the photo. */}
        {!out && (
          <button className={"pc-fab" + (added ? " done" : "")} type="button" onClick={add} aria-label={(added ? t("Added") : t("Add to cart")) + ": " + txt.name}>
            {added ? <TickIcon /> : <PlusIcon />}
          </button>
        )}
      </div>

      <div className="pc-body">
        <div className="pc-kicker">
          <span>{t(p.cat)}</span>
          <span className="mono" dir="ltr">{p.id}</span>
        </div>
        <h3 className="pc-name"><Link href={link}>{txt.name}</Link></h3>
        {txt.sub && <p className="pc-sub">{txt.sub}</p>}

        {p.fins.length > 0 && (
          <div className="pc-fins" role="radiogroup" aria-label={t(p.id.startsWith("AP-") ? "Colours" : "Finishes")}>
            {p.fins.map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={fin === f}
                aria-label={t(FIN[f].label)}
                title={t(FIN[f].label)}
                className={"pc-sw sw " + f}
                onClick={() => setFin(f)}
              />
            ))}
            {fin && <span className="pc-fin-name">{t(FIN[fin].label)}</span>}
          </div>
        )}

        <div className="pc-price" data-show="retail">
          <b className="mono">{rs(price(p.price))}</b>
          {p.was > 0 && <s className="mono">{rs(price(p.was))}</s>}
        </div>

        <div className="pc-dealer" data-show="dealer">
          <div className="pc-dl-head">
            <span>{t("Dealer price per piece")}</span>
            <span>{t(p.carton > 1 ? `${p.carton} pcs per ${packOf(p)}` : "min 1")}</span>
          </div>
          <ol className="pc-tiers">
            {slabLabels(p).map((l, k) => (
              <li key={l} className={k === 2 ? "best" : ""}>
                <small>{t(l)}</small>
                <b className="mono">{price(p.slabs[k]).toLocaleString("en-PK")}</b>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  );
}
