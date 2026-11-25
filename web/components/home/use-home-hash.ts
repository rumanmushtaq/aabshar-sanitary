"use client";

import { useEffect, useRef } from "react";

/** Scrolls a homepage section into view, instantly when the user prefers reduced motion. */
export function scrollToId(id: string) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

/**
 * Runs `on` for homepage hashes like #plastic-tanks or #look-2: when the page opens, on hashchange
 * (also back/forward), and on clicks on same-page links. Next.js changes the hash of a same-page <Link>
 * with pushState (no hashchange event) and then scrolls to an id that does not exist, so those clicks
 * are taken over here: the URL is updated, then `on` picks the tab and scrolls.
 */
export function useHomeHash(re: RegExp, on: (m: RegExpMatchArray) => void) {
  const cb = useRef(on);
  useEffect(() => {
    cb.current = on;
  });

  useEffect(() => {
    const run = (hash: string) => {
      const m = hash.match(re);
      if (m) cb.current(m);
      return !!m;
    };
    run(location.hash);

    const onHash = () => run(location.hash);
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !re.test(url.hash)) return;
      e.preventDefault();
      if (location.hash !== url.hash) history.pushState(null, "", url.hash);
      run(url.hash);
    };
    addEventListener("hashchange", onHash);
    document.addEventListener("click", onClick, true);
    return () => {
      removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick, true);
    };
  }, [re]);
}
