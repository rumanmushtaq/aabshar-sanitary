"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { useI18n, useShop } from "@/components/providers";
import { CATALOG, FIN } from "@/lib/data";
import { CloseIcon, SearchIcon } from "@/components/icons";
import { Pic } from "@/components/product/pic";

/** Popular searches: [query, label]. */
const TAGS: [string, string][] = [
  ["basin mixer", "Basin mixer"],
  ["muslim shower", "Muslim shower"],
  ["valve", "Angle valve"],
  ["tank", "Water tank"],
  ["pipe", "Pipes"],
  ["gold", "Brushed gold"],
];

const hidden: React.CSSProperties = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" };

export function SearchPanel({ open, onClose, onLeave }: { open: boolean; onClose: () => void; onLeave: () => void }) {
  const { t, rs, href } = useI18n();
  const { mode } = useShop();
  const { register, setValue, reset, control } = useForm<{ q: string }>({ defaultValues: { q: "" } });
  const typed = useWatch({ control, name: "q" });

  useEffect(() => {
    if (open) reset({ q: "" });
  }, [open, reset]);

  // English and Urdu text of each product, so either language finds it.
  const hay = useMemo(
    () => CATALOG.map((p) => {
      const fins = p.fins.map((f) => FIN[f].label);
      const en = [p.name, p.id, p.cat, p.tags ?? "", ...fins].join(" ");
      const ur = [p.name, p.cat, ...fins].map(t).join(" ");
      return (en + " " + ur).toLowerCase();
    }),
    [t],
  );

  // A popular tag puts its label in the box; search with the tag's query.
  const raw = typed.trim();
  const q = (TAGS.find(([, l]) => t(l).toLowerCase() === raw.toLowerCase())?.[0] ?? raw).toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  const hits = CATALOG.filter((_, k) => words.every((w) => hay[k].includes(w))).slice(0, 9);

  return (
    <div className={"sp" + (open ? " on" : "")} id="search" role="dialog" aria-modal="true" aria-label={t("Search products")}>
      <div className="col gut">
        <div className="sfield">
          <SearchIcon />
          <label htmlFor="sq" style={hidden}>{t("Search")}</label>
          <input id="sq" type="search" placeholder={t("Search taps, tanks, pipes, SKU…")} autoComplete="off" {...register("q")} />
          <button className="x" type="button" aria-label={t("Close search")} onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="pop-tags">
          {t("Popular:")}
          {TAGS.map(([tq, l]) => (
            <button key={tq} type="button" onClick={() => setValue("q", t(l))}>{t(l)}</button>
          ))}
        </div>
        <div className="sres" aria-live="polite">
          {hits.length ? (
            hits.map((p) => (
              <Link key={p.id} href={href("/p/" + p.id)} onClick={onLeave}>
                <Pic p={p} alt={t(p.name)} sizes="64px" />
                <span>
                  <b>{t(p.name)}</b>
                  <small>{p.id} · {mode === "dealer" ? t(rs(p.slabs[2]) + " / pc") : rs(p.price)}</small>
                </span>
              </Link>
            ))
          ) : (
            <p style={{ gridColumn: "1/-1", color: "var(--muted)", margin: 0 }}>
              {t(`No match for “${raw}”. Try “mixer”, “tank”, “pipe” or a SKU like AB-1204.`)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
