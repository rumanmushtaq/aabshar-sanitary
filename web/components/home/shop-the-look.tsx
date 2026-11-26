"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { FIN, LOOKS, type Look, type LookItem } from "@/lib/data";
import { productText } from "@/lib/i18n";
import { lookPrice } from "@/lib/pricing";
import { lookItems, soldOut } from "@/components/product/catalog";
import { useCatalog, useI18n, useShop } from "@/components/providers";
import { NextIcon, PrevIcon } from "./icons";
import { scrollToId, useHomeHash } from "./use-home-hash";

/** Pixel size of each room photo, so hotspots can be placed before the photo loads. */
const DIMS: Record<string, [number, number]> = {
  "/img/look.jpg": [1600, 1067],
  "/img/look-walnut.jpg": [1600, 1067],
  "/img/look-black.jpg": [1600, 2405],
  "/img/look-copper.jpg": [1600, 1532],
  "/img/look-kitchen.jpg": [1600, 2097],
  "/img/plastic-tanks.jpg": [1800, 1355],
};
const HASH = /^#look-(\d+)$/;
const pad = (n: number) => ("0" + n).slice(-2);

/** Crop of the room photo around a hotspot. */
function LookThumb({ L, it, name }: { L: Look; it: LookItem; name: string }) {
  return (
    <span
      className="thumb"
      role="img"
      aria-label={name}
      style={{ backgroundImage: `url(${L.img})`, backgroundPosition: `${it[1]}% ${it[2]}%`, backgroundSize: "560%" }}
    />
  );
}

/** Shop the look: room photos with hotspots on every fitting. #look-N opens room N and scrolls here. */
export function ShopTheLook() {
  const { t, rs, lang } = useI18n();
  const { mode, addItem, quickView, toast } = useShop();
  const { BY } = useCatalog();
  const [lk, setLk] = useState(0);
  const [swap, setSwap] = useState(false);
  /** Index of the hotspot whose popup is open. */
  const [pop, setPop] = useState<number | null>(null);
  /** Size of the photo box, measured after mount and on resize. */
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  /** Natural size of a loaded photo, for photos missing from DIMS. */
  const [nat, setNat] = useState<{ src: string; w: number; h: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const lastW = useRef<number | null>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const tx0 = useRef<number | null>(null);

  const L = LOOKS[lk];
  /** Hotspots whose products are in the catalogue (missing or inactive ones are skipped). */
  const items = lookItems(L, BY);
  const name = (id: string) => productText(BY[id], lang).name;
  const dealer = mode === "dealer";
  const rtl = lang === "ur";

  const showLook = (i: number) => {
    const n = (i + LOOKS.length) % LOOKS.length;
    setPop(null);
    if (n === lk) return;
    setLk(n);
    setSwap(true);
  };

  useHomeHash(HASH, (m) => {
    showLook(Number(m[1]));
    scrollToId("ideas");
  });

  // Measure the photo box; a change of width (not just height) closes the popup, as in the prototype.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (lastW.current != null && lastW.current !== w) setPop(null);
      lastW.current = w;
      setBox({ w, h: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Close the popup on a click outside it or on Escape.
  useEffect(() => {
    if (pop == null) return;
    const onDoc = (e: MouseEvent) => {
      const el = e.target as Element;
      if (!el.closest?.(".pop") && !el.closest?.(".hot")) setPop(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPop(null);
    };
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [pop]);

  // Hotspots sit on the photo as drawn with object-fit: cover and the room's object-position.
  const hots = (() => {
    if (!box || !box.w) return null;
    const d = DIMS[L.img] ?? (nat?.src === L.img ? [nat.w, nat.h] : null);
    if (!d) return null;
    const [nw, nh] = d;
    const [px, py] = (L.pos || "50% 50%").split(" ").map((v) => parseFloat(v) / 100);
    const sc = Math.max(box.w / nw, box.h / nh);
    const dw = nw * sc;
    const dh = nh * sc;
    const ox = (box.w - dw) * px;
    const oy = (box.h - dh) * py;
    return items.map((it) => {
      const x = ox + (it[1] / 100) * dw;
      const y = oy + (it[2] / 100) * dh;
      return { x, y, inside: x > 18 && x < box.w - 18 && y > 18 && y < box.h - 18 };
    });
  })();

  // Place the popup beside its hotspot, kept inside the photo.
  const hx = pop != null ? hots?.[pop]?.x : undefined;
  const hy = pop != null ? hots?.[pop]?.y : undefined;
  useLayoutEffect(() => {
    const el = popRef.current;
    if (!el || hx == null || hy == null || !box) return;
    const hl = hx - 22;
    const ht = hy - 22;
    let x = hl + 30;
    let y = ht - 10;
    if (x + el.offsetWidth > box.w - 10) x = hl - el.offsetWidth + 14;
    if (y + el.offsetHeight > box.h - 10) y = box.h - el.offsetHeight - 10;
    el.style.left = Math.max(10, x) + "px";
    el.style.top = Math.max(10, y) + "px";
  }, [hx, hy, box]);

  const priceText = (n: number) => (dealer ? t(rs(n) + " / pc") : rs(n));
  const sum = items.reduce((a, it) => a + lookPrice(BY[it[0]], it[3], mode), 0);
  const popIt = pop != null ? items[pop] : null;
  const popP = popIt ? BY[popIt[0]] : null;

  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const d = (e.key === "ArrowRight") === !rtl ? 1 : -1;
    const n = (lk + d + LOOKS.length) % LOOKS.length;
    showLook(n);
    tabs.current[n]?.focus();
  };

  const addLook = () => {
    const avail = items.filter((it) => !soldOut(BY[it[0]]));
    avail.forEach((it) => addItem(it[0], it[3], undefined, true));
    toast(`Whole look added: ${avail.length} fittings`);
  };

  const [dw, dh] = DIMS[L.img] ?? [1600, 1067];

  return (
    <section className="band gut" id="ideas">
      <div className="col">
        <div className="head rise">
          <div>
            <span className="eyebrow">{t("Shop the look")}</span>
            <h2 className="display h2" style={{ marginTop: 14 }}>
              {t("Real rooms.")} <em>{t("Every fitting for sale.")}</em>
            </h2>
            <p>{t("Pick a room, then tap a dot to see the fitting. Add one piece or the whole look.")}</p>
          </div>
          <span className="lcount mono" id="lcount" aria-live="polite" dir="ltr">{pad(lk + 1)} / {pad(LOOKS.length)}</span>
        </div>
        <div className="looktabs" role="tablist" aria-label={t("Rooms")} id="looktabs" onKeyDown={onTabKey}>
          {LOOKS.map((x, i) => (
            <button
              key={x.img + i}
              ref={(el) => { tabs.current[i] = el; }}
              type="button"
              role="tab"
              aria-selected={i === lk}
              tabIndex={i === lk ? 0 : -1}
              onClick={() => showLook(i)}
            >
              <Image src={x.img} alt="" width={112} height={112} sizes="56px" style={{ objectPosition: x.pos }} />
              <b>{t(x.name)}</b>
              <small>{t(`${lookItems(x, BY).length} fittings`)}</small>
            </button>
          ))}
        </div>
        <div className="look">
          <div
            className="lookimg"
            id="lookimg"
            ref={boxRef}
            onTouchStart={(e) => { tx0.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (tx0.current == null) return;
              const dx = e.changedTouches[0].clientX - tx0.current;
              tx0.current = null;
              if (Math.abs(dx) > 50) showLook(lk + ((dx < 0) !== rtl ? 1 : -1));
            }}
          >
            <Image
              id="lookpic"
              className={swap ? "swap" : undefined}
              src={L.img}
              alt={t(L.mood)}
              width={dw}
              height={dh}
              sizes="(max-width: 980px) 100vw, 66vw"
              style={{ objectPosition: L.pos }}
              onLoad={(e) => {
                const im = e.currentTarget;
                setSwap(false);
                setNat({ src: L.img, w: im.naturalWidth, h: im.naturalHeight });
              }}
              onError={() => setSwap(false)}
            />
            <div id="hots">
              {items.map((it, k) => {
                const h = hots?.[k];
                return (
                  <button
                    key={lk + "-" + k}
                    className="hot"
                    type="button"
                    aria-expanded={pop === k}
                    aria-label={name(it[0])}
                    hidden={!h?.inside}
                    style={h ? { left: h.x, top: h.y } : undefined}
                    onClick={() => setPop(pop === k ? null : k)}
                  >
                    <span />
                  </button>
                );
              })}
            </div>
            {popIt && popP && (
              <div className="pop" id="pop" ref={popRef}>
                <LookThumb L={L} it={popIt} name={name(popP.id)} />
                <div>
                  <b>{name(popP.id)}</b>
                  <span className="mono">{soldOut(popP) ? t("Out of stock") : priceText(lookPrice(popP, popIt[3], mode))}</span>
                </div>
                <button type="button" onClick={() => quickView(popP.id)}>{t("View fitting")}</button>
              </div>
            )}
            <div className="lnav">
              <button type="button" id="lprev" aria-label={t("Previous room")} onClick={() => showLook(lk - 1)}><PrevIcon /></button>
              <button type="button" id="lnext" aria-label={t("Next room")} onClick={() => showLook(lk + 1)}><NextIcon /></button>
            </div>
          </div>
          <aside className="lookside">
            <span className="eyebrow" style={{ color: "var(--brass-text)" }}>{t("In this photo")}</span>
            <h3 className="lname" id="lname">{t(L.name)}</h3>
            <p className="lmood" id="lmood">{t(L.mood)}</p>
            <div id="looklist">
              {items.map((it) => {
                const p = BY[it[0]];
                const fin = it[3];
                return (
                  <div key={it[0]} className="line">
                    <LookThumb L={L} it={it} name={name(p.id)} />
                    <div>
                      <b>{name(p.id)}</b>
                      <small className="mono">{p.id}{fin ? " · " + t(FIN[fin].label) : ""}</small>
                      <br />
                      <span className="mono" style={{ fontSize: ".9rem" }}>{soldOut(p) ? t("Out of stock") : priceText(lookPrice(p, fin, mode))}</span>
                    </div>
                    <button type="button" onClick={() => quickView(p.id)}>{t("View")}</button>
                  </div>
                );
              })}
            </div>
            <div className="sum" style={{ marginTop: "auto", paddingTop: 16 }}>
              <span>{t("Whole look")}</span>
              <span className="mono" id="looksum">{dealer ? t(rs(sum) + " / set") : rs(sum)}</span>
            </div>
            <button className="btn dark full" type="button" id="addlook" style={{ marginTop: 10 }} disabled={!items.some((it) => !soldOut(BY[it[0]]))} onClick={addLook}>{t("Add the whole look")}</button>
          </aside>
        </div>
      </div>
    </section>
  );
}
