"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PHONE, PHONE_TEL } from "@/lib/contact";
import { useI18n, useShop } from "@/components/providers";
import { LANGS, LANG_COOKIE, LOCALES, type Lang } from "@/lib/i18n/config";
import { BagIcon, ChevronIcon, SearchIcon } from "@/components/icons";
import { BurgerIcon, GlobeIcon } from "./icons";
import { NavLink, catSlug } from "./nav-link";

const TICKER = [
  "Factory direct from Gujranwala",
  "320+ dealers in 38 cities",
  "Free delivery in Gujranwala & Lahore over Rs 15,000",
  "Cash on Delivery across Pakistan",
];

/** Mega menu columns: [heading, [label, path][]]. */
const MEGA: [string, [string, string][]][] = [
  ["Bathroom", [
    ["Basin mixers", "/shop?cat=" + catSlug("Taps & Mixers")],
    ["Wall mixers", "/shop?cat=" + catSlug("Taps & Mixers")],
    ["Bath fillers", "/shop?cat=" + catSlug("Taps & Mixers")],
    ["Rain showers", "/shop?cat=" + catSlug("Showers")],
    ["Muslim showers", "/shop?cat=" + catSlug("Muslim Showers")],
  ]],
  ["Ceramics", [
    ["Commodes", "/shop?cat=" + catSlug("Commodes")],
    ["Counter basins", "/shop?cat=" + catSlug("Basins")],
    ["Vanity units", "/shop?cat=" + catSlug("Vanity units")],
    ["Kitchen sinks", "/shop?cat=" + catSlug("Kitchen")],
  ]],
  ["Plumbing", [
    ["Angle valves", "/shop?cat=" + catSlug("Valves & Fittings")],
    ["Ball valves", "/shop?cat=" + catSlug("Valves & Fittings")],
    ["PPR fittings", "/shop?cat=" + catSlug("Valves & Fittings")],
    ["Connection pipes", "/shop?cat=" + catSlug("Valves & Fittings")],
  ]],
  ["Plastic", [
    ["Water tanks", "/#plastic-tanks"],
    ["uPVC & PPR pipes", "/#plastic-pipes"],
    ["HDPE pipes", "/#plastic-pipes"],
    ["Stools & household", "/#plastic-home"],
  ]],
];

/** Remembers the language for the proxy, which sends "/" to it. */
function saveLang(l: Lang) {
  document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
}

/** Screen name for body[data-view], which the v7 CSS uses for the solid nav and toast position. */
function viewOf(pathname: string): string {
  const seg = pathname.split("/")[2] ?? "";
  if (!seg) return "home";
  return seg === "p" ? "product" : seg;
}

/**
 * usePathname can suspend while prerendering a route whose params are only known at request time
 * (cacheComponents), so the bar is first rendered without a path in that case.
 */
export function Header() {
  return (
    <Suspense fallback={<HeaderBar pathname={null} />}>
      <HeaderWithPath />
    </Suspense>
  );
}

function HeaderWithPath() {
  return <HeaderBar pathname={usePathname()} />;
}

function HeaderBar({ pathname }: { pathname: string | null }) {
  const { t, lang, href } = useI18n();
  const { mode, setMode, count, bump, openOverlay } = useShop();
  const router = useRouter();
  const isHome = pathname === "/" + lang || pathname === "/" + lang + "/";

  /* ticker */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setTick((k) => (k + 1) % TICKER.length), 4200);
    return () => clearInterval(id);
  }, []);

  /* menus: language list and mega menu */
  const [langOpen, setLangOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const megaTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const megaRef = useRef<HTMLDivElement>(null);
  const megaBtn = useRef<HTMLButtonElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMega(false);
    setLangOpen(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setLangOpen(false);
      if (megaRef.current?.contains(document.activeElement)) megaBtn.current?.focus();
      setMega(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const hoverable = () => matchMedia("(hover:hover)").matches;
  const openMega = () => {
    clearTimeout(megaTimer.current);
    setMega(true);
  };

  function switchLang(l: Lang) {
    setLangOpen(false);
    if (l === lang) return;
    saveLang(l);
    const parts = location.pathname.split("/");
    parts[1] = l;
    router.push(parts.join("/") + location.search + location.hash);
  }

  /* nav over the hero, scroll progress, body[data-view] */
  const [atTop, setAtTop] = useState(true);
  const prog = useRef<HTMLElement>(null);
  useEffect(() => {
    if (pathname) document.body.setAttribute("data-view", viewOf(pathname));
  }, [pathname]);
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      ticking = false;
      const y = window.scrollY || 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      setAtTop(y < 40);
      if (prog.current) prog.current.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
    };
    const onEvt = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    };
    addEventListener("scroll", onEvt, { passive: true });
    addEventListener("resize", onEvt);
    onEvt();
    return () => {
      removeEventListener("scroll", onEvt);
      removeEventListener("resize", onEvt);
    };
  }, [pathname]);

  return (
    <>
      <div className="strip gut">
        <div className="col">
          <div className="ticker">
            {TICKER.map((s, k) => <span key={s} className={k === tick ? "on" : undefined}>{t(s)}</span>)}
          </div>
          <div className="r">
            <Link href={href("/dealer")}>{t("Dealer portal")}</Link>
            <NavLink to="/#find">{t("Find a dealer")}</NavLink>
            <Link href={href("/track")}>{t("Track order")}</Link>
            <a href={"tel:" + PHONE_TEL} className="mono" dir="ltr" aria-label={t("Call " + PHONE)}>{PHONE}</a>
            <div className={"langsel" + (langOpen ? " open" : "")} ref={langRef}>
              <button
                type="button"
                id="lang-btn"
                aria-haspopup="true"
                aria-expanded={langOpen}
                aria-controls="lang-list"
                onClick={() => setLangOpen((o) => !o)}
              >
                <GlobeIcon />
                <span lang={lang}>{LANGS[lang].name}</span>
                <ChevronIcon />
              </button>
              <div className="lang-list" id="lang-list">
                {LOCALES.map((l) => (
                  <button key={l} type="button" lang={l} dir={LANGS[l].dir} aria-pressed={l === lang} onClick={() => switchLang(l)}>
                    <b>{LANGS[l].name}</b>
                    <small>{l.toUpperCase()}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className={"nav gut" + (isHome && atTop ? " top" : "")} id="nav" aria-label={t("Main")}>
        <div className="col">
          <Link className="logo" href={href("/")} aria-label={t("Aabshar home")}>
            <Image className="mark" src="/img/logo-mark.svg" alt="" width={40} height={40} />
            <span className="wm"><b>{t("AABSHAR")}</b><small>{t("SANITARY · PLASTIC")}</small></span>
          </Link>
          <div className="links">
            <div
              className={"mega-wrap" + (mega ? " open" : "")}
              ref={megaRef}
              onMouseEnter={() => hoverable() && openMega()}
              onMouseLeave={() => {
                if (hoverable()) megaTimer.current = setTimeout(() => setMega(false), 160);
              }}
              onBlur={(e) => {
                if (!megaRef.current?.contains(e.relatedTarget as Node | null)) setMega(false);
              }}
            >
              <button
                className="mega-btn"
                type="button"
                aria-expanded={mega}
                aria-controls="mega"
                ref={megaBtn}
                onClick={() => (mega ? setMega(false) : openMega())}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    openMega();
                    requestAnimationFrame(() => megaRef.current?.querySelector<HTMLElement>(".mega a")?.focus());
                  }
                }}
              >
                <span>{t("Shop")}</span>
                <ChevronIcon />
              </button>
              <div className="mega" id="mega" onClick={(e) => {
                if ((e.target as Element).closest("a")) setMega(false);
              }}>
                <div className="col gut">
                  {MEGA.map(([h, items]) => (
                    <div key={h}>
                      <h4>{t(h)}</h4>
                      {items.map(([label, to]) => <NavLink key={label} to={to}>{t(label)}</NavLink>)}
                      {h === "Plastic" && (
                        <NavLink to="/#tankf" style={{ color: "var(--brass-text)", fontWeight: 600 }}>{t("Tank size finder →")}</NavLink>
                      )}
                    </div>
                  ))}
                  <NavLink className="feature" to="/#ideas">
                    <Image src="/img/vanity-brass.jpg" alt="" width={800} height={1000} sizes="320px" />
                    <span>{t("New collection")}</span>
                    <b>{t("Brushed gold, every fitting")}</b>
                  </NavLink>
                </div>
              </div>
            </div>
            <NavLink to="/#plastic">{t("Plastic")} <span className="new">{t("NEW")}</span></NavLink>
            <NavLink to="/#sets">{t("Bathroom sets")}</NavLink>
            <NavLink to="/#ways">{t("For dealers")}</NavLink>
            <NavLink to="/#factory">{t("Our factory")}</NavLink>
          </div>
          <div className="right">
            <button className="sbox" type="button" aria-label={t("Search")} onClick={() => openOverlay("search")}>
              <SearchIcon />
              <span>{t("Search taps, tanks, pipes")}</span>
              <kbd>/</kbd>
            </button>
            <div className="mode" role="group" aria-label={t("Show prices for")}>
              <button type="button" aria-pressed={mode !== "dealer"} onClick={() => setMode("retail")}>{t("Home")}</button>
              <button type="button" aria-pressed={mode === "dealer"} onClick={() => setMode("dealer")}>{t("Dealer")}</button>
            </div>
            <button className="iconbtn" type="button" aria-label={t("Open cart")} onClick={() => openOverlay("cart")}>
              <BagIcon />
              <span key={bump} className={"badge" + (bump ? " bump" : "")}>{count}</span>
            </button>
            <button className="iconbtn burger" type="button" aria-label={t("Menu")} onClick={() => openOverlay("menu")}>
              <BurgerIcon />
            </button>
          </div>
        </div>
        <i className="prog" ref={prog} aria-hidden="true" />
      </nav>
    </>
  );
}
