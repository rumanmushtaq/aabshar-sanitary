"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers";

/** /shop filter slug for a category: "Taps & Mixers" -> "taps-mixers". */
export const catSlug = (cat: string) => cat.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * Link to a site path ("/#plastic-tanks", "/dealer", "/shop?cat=showers").
 * Next's router does not fire `hashchange`, so a hash link to the page already open
 * changes location.hash natively; the homepage listens for that to pick tabs and rooms.
 */
export function NavLink({ to, onClick, ...rest }: Omit<React.ComponentProps<typeof Link>, "href"> & { to: string }) {
  const { href } = useI18n();
  const url = href(to);
  return (
    <Link
      href={url}
      onClick={(e) => {
        onClick?.(e);
        const i = url.indexOf("#");
        if (i < 0 || url.slice(0, i) !== location.pathname || e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        const hash = url.slice(i);
        if (location.hash !== hash) {
          location.hash = hash;
        } else {
          document.getElementById(hash.slice(1))?.scrollIntoView();
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        }
      }}
      {...rest}
    />
  );
}
