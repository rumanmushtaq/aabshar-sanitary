"use client";

import { useRef, useState } from "react";
import { PT } from "@/lib/data";
import { ProductCard } from "@/components/product/product-card";
import { pick } from "@/components/product/catalog";
import { useCatalog, useI18n } from "@/components/providers";
import { scrollToId, useHomeHash } from "./use-home-hash";

type Tab = keyof typeof PT;
const TABS: [Tab, string][] = [["all", "All plastic"], ["tanks", "Water tanks"], ["pipes", "Pipes"], ["home", "Household"]];
const HASH = /^#plastic-(tanks|pipes|home)$/;

/** Plastic range tabs and product rail. #plastic-tanks / -pipes / -home pick a tab and scroll here. */
export function PlasticRange() {
  const { t, lang } = useI18n();
  const { BY } = useCatalog();
  const [tab, setTab] = useState<Tab>("all");
  const btns = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  useHomeHash(HASH, (m) => {
    setTab(m[1] as Tab);
    scrollToId("plastic");
  });

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const d = (e.key === "ArrowRight") === (lang !== "ur") ? 1 : -1;
    const i = TABS.findIndex(([k]) => k === tab) + d;
    const next = TABS[(i + TABS.length) % TABS.length][0];
    setTab(next);
    btns.current[next]?.focus();
  };

  return (
    <>
      <div className="ptabs" role="tablist" aria-label={t("Plastic range")} id="ptabs" onKeyDown={onKey}>
        {TABS.map(([k, label]) => (
          <button
            key={k}
            ref={(el) => { btns.current[k] = el; }}
            type="button"
            role="tab"
            aria-selected={k === tab}
            onClick={() => setTab(k)}
          >
            {t(label)}
          </button>
        ))}
      </div>
      <div className="rail" id="prail" role="tabpanel" aria-label={t("Plastic products")}>
        {pick(PT[tab], BY).map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </>
  );
}
