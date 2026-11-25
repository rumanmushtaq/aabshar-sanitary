export const LOCALES = ["en", "ur"] as const;
export type Lang = (typeof LOCALES)[number];
export const DEFAULT_LANG: Lang = "en";

export const LANGS: Record<Lang, { name: string; dir: "ltr" | "rtl" }> = {
  en: { name: "English", dir: "ltr" },
  ur: { name: "اردو", dir: "rtl" },
};

export const hasLang = (l: string): l is Lang => (LOCALES as readonly string[]).includes(l);

/** Cookie the proxy reads to send "/" to the last language used. */
export const LANG_COOKIE = "aab-lang";
