"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n, useShop } from "@/components/providers";
import { DownloadIcon } from "@/components/checkout/icons";
import { signOut } from "@/lib/actions/dealer";
import type { DealerInfo } from "./data";

const TABS: [string, string][] = [
  ["", "Overview"],
  ["/order", "Quick order"],
  ["/khata", "Khata"],
  ["/orders", "Orders"],
];

/** Dealer header and tabs around the current tab. Only rendered for a signed-in dealer. */
export function DealerShell({ dealer, children }: { dealer: DealerInfo; children: React.ReactNode }) {
  const { lang, t, href } = useI18n();
  const { mode, setMode, toast } = useShop();
  const pathname = usePathname();
  const [pending, start] = useTransition();

  // Opening the portal as a signed-in dealer switches the shop to dealer prices (once per visit).
  // Waits one render so the saved price mode and cart are restored first.
  const [ready, setReady] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- marks the first client render after hydration
  useEffect(() => setReady(true), []);
  const entered = useRef(false);
  useEffect(() => {
    if (!ready || entered.current) return;
    entered.current = true;
    if (mode !== "dealer") setMode("dealer");
  }, [ready, mode, setMode]);

  const leave = () =>
    start(async () => {
      try {
        await signOut();
        setMode("retail");
        toast("Signed out");
      } catch {
        toast("Something went wrong. Please try again.");
      }
    });

  return (
    <div className="col gut dp">
      <div className="dhero">
        <span className="av big" dir="ltr">{dealer.initials}</span>
        <div>
          <span className="eyebrow" style={{ color: "var(--brass)" }}>{t("Dealer portal")}</span>
          <h1 className="display ph1">{t(dealer.name)}</h1>
          <p>
            <span>{t(dealer.city)}</span> · <span>{t(`Tier ${dealer.tier} dealer`)}</span> · <span>{t("since")}</span> <span className="mono">{dealer.since}</span>
          </p>
        </div>
        <div className="dacts">
          <a className="btn glass" href={`/api/dealer/price-list?lang=${lang}`} download>
            <DownloadIcon /><span>{t("Price list")}</span>
          </a>
          <Link className="btn brass" href={href("/dealer/order")}>{t("New order")}</Link>
          <button className="btn glass" type="button" onClick={leave} disabled={pending}>{t("Sign out")}</button>
        </div>
      </div>
      <nav className="dtabs" aria-label={t("Dealer portal")}>
        {TABS.map(([path, label]) => {
          const to = href("/dealer" + path);
          return (
            <Link key={label} href={to} aria-current={pathname === to ? "page" : undefined}>{t(label)}</Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
