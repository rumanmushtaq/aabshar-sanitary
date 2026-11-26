"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useI18n, useShop } from "@/components/providers";
import { CheckIcon } from "@/components/checkout/icons";
import { signIn, signInDemo } from "@/lib/actions/dealer";
import { signInSchema, type SignIn } from "./data";

/** Sign-in for dealers who are not signed in. demo shows "See the demo portal". */
export function Gate({ demo }: { demo: boolean }) {
  const { t, href } = useI18n();
  const { setMode, toast } = useShop();
  const [pending, start] = useTransition();
  const { register, handleSubmit, setError, formState: { errors } } = useForm<SignIn>({
    resolver: zodResolver(signInSchema),
    defaultValues: { phone: "", pin: "" },
    reValidateMode: "onChange",
  });

  // The action sets the session cookie and refreshes the route, so the server renders the portal next.
  const enter = (run: () => ReturnType<typeof signInDemo>, msg: string) =>
    start(async () => {
      try {
        const r = await run();
        if (!r.ok) return setError("root", { message: r.error });
        setMode("dealer"); // also shows "Showing dealer prices (demo)"
        toast(msg);
      } catch {
        setError("root", { message: "Something went wrong. Please try again." });
      }
    });

  const phoneErr = errors.phone?.message;
  const pinErr = errors.pin?.message;
  const rootErr = errors.root?.message;
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
        <form className="gate-form" noValidate onSubmit={handleSubmit((v) => enter(() => signIn(v), "Signed in"))}>
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
          {rootErr && (
            <p role="alert" style={{ margin: 0, color: "#b3261e", fontWeight: 600 }}>{t(rootErr)}</p>
          )}
          <button className="btn dark full" type="submit" disabled={pending} aria-busy={pending || undefined}>{t("Sign in")}</button>
          {/* Demo sign-in. Remove before launch (or set DEMO_PORTAL=0). */}
          {demo && (
            <button className="btn line full" type="button" disabled={pending} onClick={() => enter(signInDemo, "Signed in (demo)")}>
              {t("See the demo portal")}
            </button>
          )}
          <p className="note center">
            <span>{t("Not a dealer yet?")}</span> <Link href={href("/#ways")}>{t("Apply as a dealer")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
