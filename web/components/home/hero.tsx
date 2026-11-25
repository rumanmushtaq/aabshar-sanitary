"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useI18n, useShop } from "@/components/providers";
import { ArrowIcon } from "./icons";

const SLIDES = [
  { src: "/img/hero.jpg", w: 1800, h: 1800, cap: "Walnut & stone" },
  { src: "/img/slide2.jpg", w: 1800, h: 1200, cap: "Warm minimal" },
  { src: "/img/slide3.jpg", w: 1800, h: 1225, cap: "Marble & brass" },
];

const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => {
  const m = matchMedia(RM);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/** Hero with a photo slideshow: next photo every 6 s, paused when the user prefers reduced motion. */
export function Hero() {
  const { t, rs, href } = useI18n();
  const { mode } = useShop();
  const reduce = useSyncExternalStore(subscribeRM, () => matchMedia(RM).matches, () => false);
  const [i, setI] = useState(0);
  // Bumped on every change so the progress bar restarts, even when the same photo is picked again.
  const [tick, setTick] = useState(0);

  const show = (k: number) => {
    setI(k);
    setTick((n) => n + 1);
  };

  useEffect(() => {
    if (reduce) return;
    const id = setTimeout(() => {
      setI((k) => (k + 1) % SLIDES.length);
      setTick((n) => n + 1);
    }, 6000);
    return () => clearTimeout(id);
  }, [i, tick, reduce]);

  const dealer = mode === "dealer";

  return (
    <header className="hero gut">
      <div className="slides" id="slides">
        {SLIDES.map((s, k) => (
          <Image
            key={s.src}
            className={k === i ? "on" : undefined}
            src={s.src}
            alt=""
            width={s.w}
            height={s.h}
            sizes="100vw"
            preload={k === 0}
          />
        ))}
      </div>
      <div className="col">
        <div className="copy">
          <span className="eyebrow" style={{ color: "var(--brass)" }}>{t("Taps · Showers · Tanks · Pipes · Made in Gujranwala")}</span>
          <h1 className="display">
            {t("Water, shaped in")} <em>{t("solid brass.")}</em>
          </h1>
          <p className="lede">{t("Bathroom fittings and plastic ware from our own factory. Buy one for your home, or buy by the carton for your shop.")}</p>
          <div className="ctas">
            <a className="btn brass" href="#shop">
              <span>{t("Explore the collection")}</span> <ArrowIcon />
            </a>
            {dealer ? (
              <Link className="btn glass" href={href("/dealer")} id="hero-cta2">{t("Open dealer portal")}</Link>
            ) : (
              <a className="btn glass" href="#ways" id="hero-cta2">{t("Become a dealer")}</a>
            )}
          </div>
        </div>
        <div className="foot">
          <div className="facts">
            <div><b>{t("10 yr")}</b><span>{t("leak warranty")}</span></div>
            <div><b>4</b><span>{t("finishes per design")}</span></div>
            <div><b>320+</b><span>{t("dealers in 38 cities")}</span></div>
          </div>
          <div className="sctl">
            <span className="scap" id="scap">{t("Pictured · " + SLIDES[i].cap)}</span>
            <div className={"sbar" + (reduce ? " paused" : "")} id="sbar" role="group" aria-label={t("Hero photos")}>
              {SLIDES.map((s, k) => (
                <button
                  key={s.src}
                  type="button"
                  className={k === i ? "on" : undefined}
                  aria-label={t("Photo " + (k + 1))}
                  aria-pressed={k === i}
                  onClick={() => show(k)}
                >
                  <i key={k === i ? "on" + tick : "off"} />
                </button>
              ))}
            </div>
          </div>
          <a className="pick" href="#best">
            <Image src="/img/tap-brass.jpg" alt="" width={128} height={128} sizes="64px" />
            <span>
              <span className="mono">AB-1204 · {t("Featured")}</span>
              <b>{t("Classic basin mixer, brass")}</b>
              <span className="p" id="pick-price">{dealer ? t("From " + rs(6400) + " / pc") : rs(8500)}</span>
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}
