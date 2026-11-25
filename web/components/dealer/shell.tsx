"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useI18n, useShop } from "@/components/providers";
import { DEALER } from "@/lib/data";
import { CheckIcon, DownloadIcon } from "@/components/checkout/icons";
import { MOBILE } from "./data";

const TABS: [string, string][] = [
  ["", "Overview"],
  ["/order", "Quick order"],
  ["/khata", "Khata"],
  ["/orders", "Orders"],
];

const signInSchema = z.object({
  phone: z.string().refine((v) => MOBILE.test(v.replace(/\s/g, "")), "Enter a mobile number like 0300-1234567"),
  pin: z.string().regex(/^\d{4,6}$/, "Enter your 4 to 6 digit PIN"),
});
type SignIn = z.infer<typeof signInSchema>;

function Gate() {
  const { t, href } = useI18n();
  const { setDealerIn, setMode, toast } = useShop();
  const { register, handleSubmit, formState: { errors } } = useForm<SignIn>({
    resolver: zodResolver(signInSchema),
    defaultValues: { phone: "", pin: "" },
    reValidateMode: "onChange",
  });
  const enter = () => {
    setDealerIn(true);
    setMode("dealer"); // also shows "Showing dealer prices (demo)"
  };
  const phoneErr = errors.phone?.message;
  const pinErr = errors.pin?.message;
  return (
    <div className="col gut dp">
      <div className="gate">
        <div className="gate-art">
          <Image src="/img/fittings.jpg" alt="" width={1200} height={1500} sizes="(max-width: 860px) 100vw, 55vw" />
          <div>
            <span className="eyebrow" style={{ color: "var(--brass)" }}>{t("Dealer portal")}</span>
            <h1 className="display ph1" style={{ color: "#fff" }}>{t("Your shop’s account with the factory")}</h1>
            <ul className="ticks">
              {["Carton slab prices", "Order on credit, see your khata", "Reorder in one tap", "Track every truck"].map((s) => (
                <li key={s}><CheckIcon /><span>{t(s)}</span></li>
              ))}
            </ul>
          </div>
        </div>
        <form
          className="gate-form"
          noValidate
          onSubmit={handleSubmit(() => {
            enter();
            toast("Signed in (demo)");
          })}
        >
          <h2>{t("Sign in")}</h2>
          <div className={"fld" + (phoneErr ? " bad" : "")}>
            <label htmlFor="dl-phone">{t("Registered mobile number")}</label>
            <input
              id="dl-phone" type="tel" inputMode="tel" placeholder="0300-1234567" dir="ltr" autoComplete="tel"
              aria-invalid={phoneErr ? true : undefined} aria-describedby={phoneErr ? "e-dl-phone" : undefined}
              {...register("phone")}
            />
            {phoneErr && <small className="err" id="e-dl-phone">{t(phoneErr)}</small>}
          </div>
          <div className={"fld" + (pinErr ? " bad" : "")}>
            <label htmlFor="dl-pin">{t("PIN")}</label>
            <input
              id="dl-pin" type="password" inputMode="numeric" autoComplete="current-password" dir="ltr"
              aria-invalid={pinErr ? true : undefined} aria-describedby={pinErr ? "e-dl-pin" : undefined}
              {...register("pin")}
            />
            {pinErr && <small className="err" id="e-dl-pin">{t(pinErr)}</small>}
          </div>
          <button className="btn dark full" type="submit">{t("Sign in")}</button>
          <button className="btn line full" type="button" onClick={enter}>{t("See the demo portal")}</button>
          <p className="note center">
            <span>{t("Not a dealer yet?")}</span> <Link href={href("/#ways")}>{t("Apply as a dealer")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

/** Dealer portal frame: sign-in gate, or the dealer header and tabs around the current tab. */
export function DealerShell({ children }: { children: React.ReactNode }) {
  const { t, href } = useI18n();
  const { dealerIn, setDealerIn, mode, setMode, toast } = useShop();
  const pathname = usePathname();
  // Sign-in and price mode are restored from storage after mount; wait so a signed-in dealer never sees the gate flash.
  const [ready, setReady] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- marks the first client render after hydration
  useEffect(() => setReady(true), []);

  // Opening the portal as a signed-in dealer switches the shop to dealer prices (once per visit).
  const entered = useRef(false);
  useEffect(() => {
    if (!ready || !dealerIn) {
      entered.current = false;
      return;
    }
    if (entered.current) return;
    entered.current = true;
    if (mode !== "dealer") setMode("dealer");
  }, [ready, dealerIn, mode, setMode]);

  if (!ready) return <div className="col gut dp" />;
  if (!dealerIn) return <Gate />;

  const signOut = () => {
    setDealerIn(false);
    setMode("retail");
    toast("Signed out");
  };

  return (
    <div className="col gut dp">
      <div className="dhero">
        <span className="av big">{DEALER.init}</span>
        <div>
          <span className="eyebrow" style={{ color: "var(--brass)" }}>{t("Dealer portal")}</span>
          <h1 className="display ph1">{t(DEALER.name)}</h1>
          <p>
            <span>{t(DEALER.city)}</span> · <span>{t("Tier B dealer")}</span> · <span>{t("since")}</span> <span className="mono">{DEALER.since}</span>
          </p>
        </div>
        <div className="dacts">
          <button className="btn glass" type="button" onClick={() => toast("Downloads a PDF in the live site")}>
            <DownloadIcon /><span>{t("Price list PDF")}</span>
          </button>
          <Link className="btn brass" href={href("/dealer/order")}>{t("New order")}</Link>
          <button className="btn glass" type="button" onClick={signOut}>{t("Sign out")}</button>
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
