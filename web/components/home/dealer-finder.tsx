"use client";

import { useState } from "react";
import { CITIES } from "@/lib/data";
import { useI18n } from "@/components/providers";
import "./home.css";

const NAMES = Object.keys(CITIES);

/** Find a shop: authorised dealers by city, with phone and directions. */
export function DealerFinder() {
  const { t, lang } = useI18n();
  const [city, setCity] = useState(NAMES[0]);
  const c = CITIES[city];
  const comma = lang === "ur" ? "، " : ", ";
  return (
    <section className="band gut" id="find" style={{ paddingTop: 0 }}>
      <div className="col find">
        <div>
          <span className="eyebrow" style={{ color: "var(--brass-text)" }}>{t("Find a shop")}</span>
          <h2 className="display h2" style={{ marginTop: 14 }}>{t("Touch it before you buy it")}</h2>
          <p style={{ color: "var(--muted)", margin: "16px 0 26px", maxWidth: "40ch" }}>
            {t("Our fittings and tanks are on display at 320+ authorised dealers. Pick your city.")}
          </p>
          <div className="cities" role="group" aria-label={t("City")} id="cities">
            {NAMES.map((n) => (
              <button key={n} type="button" aria-pressed={n === city} onClick={() => setCity(n)}>
                <span>{t(n)}</span><small className="mono">{CITIES[n].n}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="dlist" id="dlist" aria-live="polite">
          <p className="dcount"><b className="mono">{c.n}</b> <span>{t("dealers in")}</span> <span>{t(city)}</span></p>
          {c.list.map(([shop, area, phone]) => (
            <div key={shop} className="dshop">
              <b>{t(shop)}</b>
              <span><span>{t(area)}</span>{comma}<span>{t(city)}</span></span>
              <a className="tel mono" dir="ltr" href={"tel:" + phone.replace(/\s/g, "")}>{phone}</a>
              <a
                href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${shop}, ${area}, ${city}, Pakistan`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("Directions")}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
