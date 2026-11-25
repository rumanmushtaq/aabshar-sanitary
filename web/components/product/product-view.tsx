"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BY, FIN, LOOKS, SHIP, type FinishId } from "@/lib/data";
import { finWord, packOf, slabIndex, slabLabels, unitPrice } from "@/lib/pricing";
import { etaDate, shipFee } from "@/lib/shipping";
import { useI18n, useShop } from "@/components/providers";
import { WhatsAppIcon } from "@/components/icons";
import { gallery, type GalleryImg } from "./catalog";
import { TruckIcon } from "./product-icons";

const CITIES = Object.keys(SHIP) as [string, ...string[]];
const shipSchema = z.object({ city: z.enum(CITIES) });
type ShipForm = z.infer<typeof shipSchema>;

// Today's date, read only in the browser so the prerendered HTML never carries a stale date.
const noSubscribe = () => () => {};
const useToday = () => useSyncExternalStore(noSubscribe, () => new Date().toDateString(), () => null);

function GImg({ g, className, sizes, preload }: { g: GalleryImg; className?: string; sizes: string; preload?: boolean }) {
  return (
    <Image
      className={className}
      src={g.src}
      alt=""
      width={1000}
      height={1000}
      sizes={sizes}
      preload={preload}
      style={{ objectPosition: g.pos, ...(g.zoom ? { transform: "scale(2.2)", transformOrigin: g.pos } : {}) }}
    />
  );
}

/**
 * Gallery and buy box of the product page, plus the sticky mobile bar.
 * children (perks and accordion) are rendered by the server at the end of the info column.
 */
export function ProductView({ id, children }: { id: string; children?: React.ReactNode }) {
  const p = BY[id];
  const { t, rs, href, dateStr } = useI18n();
  const { mode, addItem, openOverlay, toast } = useShop();
  const router = useRouter();
  const dealer = mode === "dealer";

  const g = gallery(p);
  const [imgIdx, setImgIdx] = useState(0);
  const gi = g[imgIdx] ?? g[0];

  const [fin, setFin] = useState<FinishId | "">((p.fins.includes("chrome") ? "chrome" : p.fins[0]) ?? "");
  const mult = fin ? FIN[fin].mult : 1;

  // null until the shopper touches the stepper, so the default follows the price mode once it is restored.
  const [qtyState, setQty] = useState<number | null>(null);
  let qty = qtyState ?? (dealer ? p.carton * 5 : 1);
  if (dealer && qty % p.carton) qty = Math.max(p.carton, Math.round(qty / p.carton) * p.carton);
  if (!dealer && qty > 20) qty = 1;
  const step = dealer ? p.carton : 1;
  const bump = (d: number) => setQty(Math.max(dealer ? p.carton : 1, qty + d));

  const each = unitPrice(p, fin, qty, mode);
  const total = each * qty;

  const { register, control } = useForm<ShipForm>({ resolver: zodResolver(shipSchema), defaultValues: { city: "Gujranwala" } });
  const city = useWatch({ control, name: "city" });
  const fee = shipFee(city, dealer ? 0 : total);
  const today = useToday();
  const eta = today ? etaDate((SHIP[city] ?? SHIP.Lahore).d, new Date(today)) : null;

  const add = () => {
    addItem(p.id, fin, qty, true);
    openOverlay("cart");
  };
  const buy = () => {
    addItem(p.id, fin, qty, true);
    router.push(href("/checkout"));
  };

  // Hover zoom follows the pointer on photos (room crops are already zoomed).
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gi.zoom || !matchMedia("(hover:hover)").matches) return;
    const img = e.currentTarget.querySelector<HTMLImageElement>("img.main");
    if (!img) return;
    const r = e.currentTarget.getBoundingClientRect();
    img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    img.classList.add("zoomed");
  };
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.querySelector("img.main")?.classList.remove("zoomed");
  };

  const word = finWord(p);
  const slab = slabIndex(p, qty);

  return (
    <>
      <div className="pgrid">
        <div className="pgal">
          <div className="pmain" id="pmain" onMouseMove={onMove} onMouseLeave={onLeave}>
            <GImg key={imgIdx} g={gi} className="main" sizes="(max-width: 860px) 100vw, 55vw" preload={imgIdx === 0} />
            {p.flag && <span className={"flag" + (p.sale ? " sale" : "")}>{t(p.flag)}</span>}
            {gi.look != null && (
              <Link className="inroom" href={href(`/#look-${gi.look}`)}>
                <span>{t("Seen in")}</span> <b>{t(LOOKS[gi.look].name)}</b>
              </Link>
            )}
          </div>
          {g.length > 1 && (
            <div className="pthumbs" role="group" aria-label={t("Product photos")}>
              {g.map((x, i) => (
                <button key={i} type="button" aria-pressed={i === imgIdx} aria-label={t(`Photo ${i + 1}`)} onClick={() => setImgIdx(i)}>
                  <GImg g={x} sizes="84px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pinfo">
          <span className="eyebrow" style={{ color: "var(--brass-text)" }}>
            {t(p.cat)} · <span className="sku-t">{p.id}</span>
          </span>
          <h1 className="display ph1">{t(p.name)}</h1>
          <p className="psub">{t(p.sub ?? p.specs[0])}</p>

          {dealer ? (
            <>
              <div className="pslab">
                {slabLabels(p).map((l, k) => (
                  <div key={l} className={k === slab ? "on" : ""}>
                    <span>{t(l)}</span>
                    <b className="mono">{rs(p.slabs[k] * mult)}</b>
                  </div>
                ))}
              </div>
              <p className="note">
                <span>{t(p.carton > 1 ? `Per piece · ${packOf(p)} of ${p.carton}` : "Per piece · min 1")}</span> ·{" "}
                <span className="ok">{t("In stock at Gujranwala")}</span>
              </p>
            </>
          ) : (
            <>
              <div className="price">
                <span className="now big">{rs(p.price * mult)}</span>
                {p.was > 0 && (
                  <>
                    <span className="was">{rs(p.was * mult)}</span>
                    <span className="save">{t(p.flag && p.sale ? p.flag : "Sale")}</span>
                  </>
                )}
              </div>
              <p className="note">
                <span>{t("Price includes tax")}</span> · <span className="ok">{t("In stock")}</span>
              </p>
            </>
          )}

          {fin && (
            <div className="pblock">
              <span className="plabel">
                <span>{t(word === "colour" ? "Colour" : "Finish")}</span>: <b>{t(FIN[fin].label)}</b>
              </span>
              <div className="chips">
                {p.fins.map((f) => (
                  <button key={f} type="button" aria-pressed={f === fin} onClick={() => setFin(f)}>
                    <span className={"sw " + f} />
                    {t(FIN[f].label)}
                    {FIN[f].mult > 1 && <small className="mono">+{Math.round((FIN[f].mult - 1) * 100)}%</small>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pblock">
            <span className="plabel">
              {dealer ? (
                <>
                  <span>{t("Quantity")}</span>: <b className="mono">{qty / p.carton}</b>{" "}
                  <span>{t(p.carton > 1 ? packOf(p) + "s" : "pcs")}</span> · <span className="mono">{qty}</span> <span>{t("pcs")}</span>
                </>
              ) : (
                <span>{t("Quantity")}</span>
              )}
            </span>
            <div className="pbuy">
              <span className="step-q big">
                <button type="button" aria-label={t("Fewer")} onClick={() => bump(-step)}>−</button>
                <span className="mono">{dealer ? qty / p.carton : qty}</span>
                <button type="button" aria-label={t("More")} onClick={() => bump(step)}>+</button>
              </span>
              <button className="btn dark" type="button" id="p-add" onClick={add}>
                <span>{t("Add to cart")}</span> · <span className="mono">{rs(total)}</span>
              </button>
            </div>
            <button className="btn brass full" type="button" id="p-buy" onClick={buy}>
              {t(dealer ? "Order now on credit" : "Buy now · Cash on Delivery")}
            </button>
            <button className="btn wa full" type="button" id="p-wa" onClick={() => toast(`Opens WhatsApp with ${p.id} in the message`)}>
              <WhatsAppIcon />
              <span>{t("Ask about this on WhatsApp")}</span>
            </button>
          </div>

          <div className="pship">
            <TruckIcon />
            <div>
              <label htmlFor="pcity">{t("Deliver to")}</label>{" "}
              <select id="pcity" {...register("city")}>
                {CITIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}
              </select>
              <p>
                <span>{t("Arrives by")}</span> <b>{eta ? dateStr(eta, true) : " "}</b> ·{" "}
                {dealer ? (
                  <span>{t("Dealer freight on our truck")}</span>
                ) : fee ? (
                  <><span className="mono">{rs(fee)}</span> <span>{t("delivery")}</span></>
                ) : (
                  <span className="ok">{t("Free delivery")}</span>
                )}
              </p>
            </div>
          </div>

          {children}
        </div>
      </div>

      <div className="pbar" id="pbar">
        <div>
          <b>{t(p.name)}</b>
          <span className="mono">{rs(total)}</span>
        </div>
        <button className="btn dark" type="button" onClick={add}>{t("Add to cart")}</button>
      </div>
    </>
  );
}
