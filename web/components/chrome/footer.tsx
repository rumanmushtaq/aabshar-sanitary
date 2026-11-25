"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useI18n, useShop } from "@/components/providers";
import { NavLink, catSlug } from "./nav-link";

const newsSchema = z.object({ email: z.email() });
type News = z.infer<typeof newsSchema>;

const hidden: React.CSSProperties = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" };

/** [heading, [label, path][]]; "#top" stays on the current page as in v7. */
const COLS: [string, [string, string][]][] = [
  ["Shop", [
    ["Taps & mixers", "/shop?cat=" + catSlug("Taps & Mixers")],
    ["Showers", "/shop?cat=" + catSlug("Showers")],
    ["Muslim showers", "/shop?cat=" + catSlug("Muslim Showers")],
    ["Water tanks & pipes", "/#plastic"],
    ["Bathroom sets", "/#sets"],
  ]],
  ["Dealers", [
    ["Become a dealer", "/#ways"],
    ["Dealer login", "/dealer"],
    ["Price list", "/#ways"],
    ["Find a shop", "/#find"],
  ]],
  ["Help", [
    ["Track order", "#top"],
    ["Warranty registration", "#top"],
    ["Returns", "#top"],
    ["Installation videos", "#top"],
  ]],
];

function NewsForm() {
  const { t } = useI18n();
  const { toast } = useShop();
  const { register, handleSubmit, reset, formState } = useForm<News>({ resolver: zodResolver(newsSchema), defaultValues: { email: "" } });
  return (
    <form
      className="news"
      onSubmit={handleSubmit(() => {
        reset();
        toast("Subscribed. New designs come to your inbox.");
      })}
    >
      <label htmlFor="nl" style={hidden}>{t("Email")}</label>
      <input
        id="nl"
        type="email"
        placeholder={t("Email for new designs")}
        required
        autoComplete="email"
        aria-invalid={formState.errors.email ? true : undefined}
        {...register("email")}
      />
      <button className="btn brass" type="submit" style={{ padding: "10px 18px", minHeight: 44 }}>{t("Join")}</button>
    </form>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="gut">
      <div className="col">
        <div className="fgrid">
          <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
            <span className="logo">
              <Image className="mark" src="/img/logo-mark.svg" alt="" width={48} height={48} />
              <span className="wm"><b>{t("AABSHAR")}</b><small>{t("SANITARY · PLASTIC")}</small></span>
            </span>
            <p style={{ margin: 0, maxWidth: "34ch" }}>{t("Sanitary fittings made in Gujranwala, Pakistan. Sold to homes and through 320+ dealers.")}</p>
            <NewsForm />
          </div>
          {COLS.map(([h, links]) => (
            <div key={h}>
              <h4>{t(h)}</h4>
              {links.map(([label, to]) =>
                to.startsWith("#") ? <a key={label} href={to}>{t(label)}</a> : <NavLink key={label} to={to}>{t(label)}</NavLink>,
              )}
            </div>
          ))}
        </div>
        <p className="word" aria-hidden="true">{t("Aabshar")}</p>
        <div className="legal">
          <span>{t("© 2026 Aabshar Sanitary · Design concept. Photos from Unsplash (free licence). Dealer names and numbers are samples.")}</span>
          <span>{t("Cash on Delivery · JazzCash · Easypaisa · Bank")}</span>
        </div>
      </div>
    </footer>
  );
}
