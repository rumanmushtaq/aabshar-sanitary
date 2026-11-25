"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useI18n, useShop } from "@/components/providers";
import { BagIcon, CloseIcon, SearchIcon, WhatsAppIcon } from "@/components/icons";
import { GridIcon, HomeIcon } from "./icons";
import { NavLink, catSlug } from "./nav-link";
import { SearchPanel } from "./search-panel";
import { QuickView } from "./quick-view";
import { CartDrawer } from "./cart-drawer";

const DIALOG = { cart: "cartd", search: "search", menu: "menud", qv: "qv" } as const;

const MENU: [string, string][] = [
  ["Shop", "/#shop"],
  ["Plastic range", "/#plastic"],
  ["Bathroom sets", "/#sets"],
  ["For dealers", "/#ways"],
  ["Dealer portal", "/dealer"],
  ["Our factory", "/#factory"],
  ["Shop the look", "/#ideas"],
];
const MENU_CATS: [string, string][] = [
  ["Taps & mixers", "/shop?cat=" + catSlug("Taps & Mixers")],
  ["Showers", "/shop?cat=" + catSlug("Showers")],
  ["Muslim showers", "/shop?cat=" + catSlug("Muslim Showers")],
  ["Commodes & basins", "/shop?cat=" + catSlug("Commodes")],
  ["Valves & fittings", "/shop?cat=" + catSlug("Valves & Fittings")],
  ["Water tanks", "/#plastic-tanks"],
  ["Pipes", "/#plastic-pipes"],
  ["Household plastic", "/#plastic-home"],
];

const WA_CHAT = "Opens WhatsApp chat: 0300 000 0000";

/** Scrim, search, quick view, cart and menu drawers, mobile tab bar, WhatsApp button and toast. */
export function Overlays() {
  const { t } = useI18n();
  const { mode, overlay, openOverlay, closeOverlay, qvId, count, toast, toastMsg, toastOn } = useShop();

  // Focus moves into the open dialog and back to where it was after closing.
  // A quiet close (a link inside the dialog was followed) leaves focus alone.
  const lastFocus = useRef<HTMLElement | null>(null);
  const quiet = useRef(false);
  const prev = useRef<typeof overlay>(null);
  useEffect(() => {
    const was = prev.current;
    prev.current = overlay;
    if (overlay) {
      if (!was) lastFocus.current = document.activeElement as HTMLElement | null;
      const el = document.getElementById(DIALOG[overlay]);
      const id = setTimeout(() => el?.querySelector<HTMLElement>("input, button, a[href]")?.focus(), 60);
      return () => clearTimeout(id);
    }
    if (was && !quiet.current) lastFocus.current?.focus?.();
    quiet.current = false;
  }, [overlay]);

  const leave = () => {
    quiet.current = true;
    closeOverlay();
  };

  const routeChanged = () => {
    if (prev.current) leave();
  };

  // Escape closes; "/" opens search when not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && overlay) closeOverlay();
      if (e.key === "/" && !overlay && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const a = document.activeElement as HTMLElement | null;
        if (a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable)) return;
        e.preventDefault();
        openOverlay("search");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [overlay, openOverlay, closeOverlay]);

  // New quick-view session each time it opens, so finish and quantity start fresh.
  const [qvSeq, setQvSeq] = useState(0);
  const [prevOverlay, setPrevOverlay] = useState(overlay);
  if (prevOverlay !== overlay) {
    setPrevOverlay(overlay);
    if (overlay === "qv") setQvSeq((s) => s + 1);
  }

  return (
    <>
      <Suspense fallback={null}>
        <RouteWatch onChange={routeChanged} />
      </Suspense>

      <div className={"scrim" + (overlay ? " on" : "")} onClick={closeOverlay} />

      <SearchPanel open={overlay === "search"} onClose={closeOverlay} onLeave={leave} />

      <div className={"modal" + (overlay === "qv" ? " on" : "")} id="qv" role="dialog" aria-modal="true" aria-labelledby="qv-title">
        {qvId && <QuickView key={qvId + qvSeq + mode} id={qvId} onClose={closeOverlay} onLeave={leave} />}
      </div>

      <CartDrawer open={overlay === "cart"} onClose={closeOverlay} onLeave={leave} />

      <aside className={"drawer left" + (overlay === "menu" ? " on" : "")} id="menud" role="dialog" aria-modal="true" aria-label={t("Menu")}>
        <div className="dhead">
          <span className="logo dark">
            <Image className="mark" src="/img/logo-mark.svg" alt="" width={40} height={40} />
            <span className="wm"><b>{t("AABSHAR")}</b><small>{t("SANITARY · PLASTIC")}</small></span>
          </span>
          <button className="x" type="button" aria-label={t("Close menu")} onClick={closeOverlay}><CloseIcon /></button>
        </div>
        <nav className="dbody mlinks" aria-label={t("Mobile")}>
          {MENU.map(([label, to]) => <NavLink key={label} to={to} onClick={leave}>{t(label)}</NavLink>)}
          <h4>{t("Categories")}</h4>
          {MENU_CATS.map(([label, to]) => <NavLink key={label} className="sm" to={to} onClick={leave}>{t(label)}</NavLink>)}
        </nav>
      </aside>

      <nav className="tabbar" aria-label={t("Quick links")}>
        <NavLink to="/#top"><HomeIcon />{t("Home")}</NavLink>
        <NavLink to="/#shop"><GridIcon />{t("Shop")}</NavLink>
        <button type="button" onClick={() => openOverlay("search")}><SearchIcon />{t("Search")}</button>
        <button type="button" onClick={() => openOverlay("cart")}>
          <BagIcon strokeWidth={1.8} />
          {t("Cart")}
          <span className="badge">{count}</span>
        </button>
        <button type="button" className="wa" onClick={() => toast(WA_CHAT)}><WhatsAppIcon />{t("WhatsApp")}</button>
      </nav>

      <button className="wa-float" type="button" onClick={() => toast(WA_CHAT)}>
        <span className="i"><WhatsAppIcon /></span>
        <span className="t">{t("Chat on WhatsApp")}</span>
      </button>

      <div className={"toast" + (toastOn ? " on" : "")} role="status">
        <i />
        <span>{toastMsg}</span>
      </div>
    </>
  );
}

/** Calls onChange when the path changes (in Suspense: usePathname can suspend while prerendering). */
function RouteWatch({ onChange }: { onChange: () => void }) {
  const pathname = usePathname();
  const last = useRef(pathname);
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });
  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    cb.current();
  }, [pathname]);
  return null;
}
