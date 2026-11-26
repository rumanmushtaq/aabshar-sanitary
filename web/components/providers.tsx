"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n/config";
import { getT, productText, rs as rsFor, href as hrefFor, dateStr as dateFor, type T } from "@/lib/i18n";
import type { FinishId, Product } from "@/lib/data";
import { cartCount, cartSum, packOf, type ById, type CartLine, type Mode } from "@/lib/pricing";
import type { ShipRates } from "@/lib/store";

/* ---------- language ---------- */

type I18n = {
  lang: Lang;
  t: T;
  rs: (n: number) => string;
  href: (path: string) => string;
  dateStr: (d: Date | string, long?: boolean) => string;
};

const I18nCtx = createContext<I18n | null>(null);

export function useI18n(): I18n {
  const v = useContext(I18nCtx);
  if (!v) throw new Error("useI18n outside <Providers>");
  return v;
}

/* ---------- catalogue from the database ---------- */

type Catalog = { catalog: Product[]; BY: ById; ship: ShipRates };

const CatalogCtx = createContext<Catalog | null>(null);

/** Active products (in display order), products by SKU, and delivery rates by city. */
export function useCatalog(): Catalog {
  const v = useContext(CatalogCtx);
  if (!v) throw new Error("useCatalog outside <Providers>");
  return v;
}

/* ---------- shop: price mode, cart, toast, overlays ---------- */

type Overlay = "cart" | "search" | "menu" | "qv" | null;

type Shop = {
  mode: Mode;
  setMode: (m: Mode) => void;
  cart: CartLine[];
  count: number;
  sum: number;
  /** Adds a product. qty defaults to 1 piece, or 1 carton in dealer mode. */
  addItem: (id: string, fin?: FinishId | "", qty?: number, quiet?: boolean) => void;
  setQty: (index: number, qty: number) => void;
  removeLine: (index: number) => void;
  clearCart: () => void;
  toast: (msg: string) => void;
  toastMsg: string;
  toastOn: boolean;
  overlay: Overlay;
  openOverlay: (o: Overlay) => void;
  closeOverlay: () => void;
  /** Product shown in quick view. */
  qvId: string | null;
  quickView: (id: string) => void;
  /** Bumped on every add, so the cart badge can replay its animation. */
  bump: number;
};

const ShopCtx = createContext<Shop | null>(null);

export function useShop(): Shop {
  const v = useContext(ShopCtx);
  if (!v) throw new Error("useShop outside <Providers>");
  return v;
}

function load<V>(key: string, fallback: V): V {
  try {
    const s = localStorage.getItem(key);
    return s == null ? fallback : (JSON.parse(s) as V);
  } catch {
    return fallback;
  }
}

function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}

export function Providers({ lang, catalog, ship, children }: {
  lang: Lang;
  catalog: Product[];
  ship: ShipRates;
  children: React.ReactNode;
}) {
  const cat = useMemo<Catalog>(() => ({ catalog, BY: Object.fromEntries(catalog.map((p) => [p.id, p])), ship }), [catalog, ship]);
  const BY = cat.BY;

  const i18n = useMemo<I18n>(() => {
    const t = getT(lang);
    return {
      lang,
      t,
      rs: (n) => rsFor(n, lang),
      href: (p) => hrefFor(p, lang),
      dateStr: (d, long) => dateFor(d, lang, long),
    };
  }, [lang]);

  // Saved state is read after mount, so the server HTML (retail, empty cart) always matches the first render.
  const [mode, setModeState] = useState<Mode>("retail");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time restore of saved state after hydration */
    setModeState(load<Mode>("aab-mode", "retail") === "dealer" ? "dealer" : "retail");
    setCart(load<CartLine[]>("aab-cart", []).filter((l) => BY[l.id] && l.qty > 0));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [BY]);

  useEffect(() => {
    if (ready) save("aab-cart", cart);
  }, [cart, ready]);

  useEffect(() => {
    document.body.classList.toggle("dealer", mode === "dealer");
    document.body.classList.toggle("retail", mode !== "dealer");
  }, [mode]);

  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toast = useCallback(
    (msg: string) => {
      setToastMsg(i18n.t(msg));
      setToastOn(true);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToastOn(false), 2400);
    },
    [i18n],
  );

  const setMode = useCallback(
    (m: Mode) => {
      setModeState(m);
      save("aab-mode", m);
      // Quantities are pieces in both modes; dealer mode rounds each line up to whole cartons.
      if (m === "dealer") {
        setCart((c) => c.map((l) => {
          const n = BY[l.id].carton;
          return { ...l, qty: Math.max(n, Math.ceil(l.qty / n) * n) };
        }));
        toast("Showing dealer prices");
      }
    },
    [BY, toast],
  );

  const [bump, setBump] = useState(0);
  const addItem = useCallback<Shop["addItem"]>(
    (id, fin, qty, quiet) => {
      const p = BY[id];
      if (!p) return;
      const f = fin === undefined ? (p.fins[0] ?? "") : fin;
      const q = qty ?? (mode === "dealer" ? p.carton : 1);
      setCart((c) => {
        const i = c.findIndex((l) => l.id === id && l.fin === f);
        if (i < 0) return [...c, { id, fin: f, qty: q }];
        return c.map((l, k) => (k === i ? { ...l, qty: l.qty + q } : l));
      });
      setBump((b) => b + 1);
      if (quiet) return;
      if (mode !== "dealer") {
        // Admin-entered Urdu name when there is one; toast() leaves already-Urdu text as it is.
        const name = productText(p, i18n.lang).name;
        toast(i18n.lang === "ur" ? name + " کارٹ میں شامل" : name + " added to cart");
      }
      else if (p.carton > 1) {
        const n = q / p.carton;
        toast(`${n} ${packOf(p)}${n > 1 ? "s" : ""} of ${id} added`);
      } else toast(`${q} pcs of ${id} added`);
    },
    [BY, i18n.lang, mode, toast],
  );

  const setQty = useCallback((index: number, qty: number) => {
    setCart((c) => (qty <= 0 ? c.filter((_, k) => k !== index) : c.map((l, k) => (k === index ? { ...l, qty } : l))));
  }, []);
  const removeLine = useCallback((index: number) => setCart((c) => c.filter((_, k) => k !== index)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const [overlay, setOverlay] = useState<Overlay>(null);
  const [qvId, setQvId] = useState<string | null>(null);
  const openOverlay = useCallback((o: Overlay) => setOverlay(o), []);
  const closeOverlay = useCallback(() => setOverlay(null), []);
  const quickView = useCallback((id: string) => {
    setQvId(id);
    setOverlay("qv");
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = overlay ? "hidden" : "";
  }, [overlay]);

  const shop: Shop = {
    mode,
    setMode,
    cart,
    count: cartCount(cart),
    sum: cartSum(cart, BY, mode),
    addItem,
    setQty,
    removeLine,
    clearCart,
    toast,
    toastMsg,
    toastOn,
    overlay,
    openOverlay,
    closeOverlay,
    qvId,
    quickView,
    bump,
  };

  return (
    <I18nCtx.Provider value={i18n}>
      <CatalogCtx.Provider value={cat}>
        <ShopCtx.Provider value={shop}>{children}</ShopCtx.Provider>
      </CatalogCtx.Provider>
    </I18nCtx.Provider>
  );
}
