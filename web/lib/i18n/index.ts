import type { Lang } from "./config";
import type { Product } from "../data";
import ur from "./ur";
import rules from "./ur/rules";

export type T = (text: string) => string;

/** Urdu for an English string, or null when there is none. */
function toUrdu(k: string): string | null {
  const key = k.trim();
  if (!key) return k;
  if (key in ur) return ur[key];
  for (const [re, fn] of rules) {
    const m = key.match(re);
    if (m) {
      const v = fn(m, toUrdu);
      if (v != null) return v;
    }
  }
  return null;
}

/**
 * Translator for a language. English text is the key, so English pages need no lookup.
 * A missing Urdu string falls back to English and is logged in development.
 */
export function getT(lang: Lang): T {
  if (lang === "en") return (s) => s;
  return (s) => {
    const v = toUrdu(s);
    if (v == null) {
      if (process.env.NODE_ENV !== "production") console.warn(`[i18n] missing Urdu: ${JSON.stringify(s)}`);
      return s;
    }
    return v;
  };
}

/** Price: "Rs 8,500" in English, "8,500 روپے" in Urdu. */
export function rs(n: number, lang: Lang): string {
  const v = Math.round(n).toLocaleString("en-PK");
  return lang === "ur" ? v + " روپے" : "Rs " + v;
}

/** Date: "21 Nov 2026" or, long, "Saturday, 21 November". */
export function dateStr(d: Date | string, lang: Lang, long = false): string {
  const date = typeof d === "string" ? new Date(d + "T00:00:00+05:00") : d;
  return date.toLocaleDateString(lang === "ur" ? "ur-PK" : "en-GB", long
    ? { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Karachi" }
    : { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" });
}

/** Path with the language prefix: href("/p/AB-1204", "ur") is "/ur/p/AB-1204", href("/#plastic", "en") is "/en#plastic". */
export function href(path: string, lang: Lang): string {
  if (path === "/") return "/" + lang;
  if (path.startsWith("/#")) return "/" + lang + path.slice(1);
  return "/" + lang + path;
}

/** Product name, sub-line and specs in a language: admin-entered Urdu first, then the dictionary, then English. */
export function productText(p: Product, lang: Lang) {
  if (lang === "en") return { name: p.name, sub: p.sub, specs: p.specs };
  const t = getT(lang);
  return {
    name: p.nameUr || t(p.name),
    sub: p.sub ? p.subUr || t(p.sub) : undefined,
    specs: p.specsUr?.length ? p.specsUr : p.specs.map(t),
  };
}
