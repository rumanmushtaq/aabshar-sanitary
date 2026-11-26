"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCatalog, useI18n, useShop } from "@/components/providers";
import { Pic } from "@/components/product/pic";
import { FIN, PAYS } from "@/lib/data";
import { productText } from "@/lib/i18n";
import type { Mode } from "@/lib/pricing";
import { etaDate, rateFor, shipFee } from "@/lib/shipping";
import { CONTACT_FIELDS, NEXT_DAY_FEE, contactSchema, nextDayCity, quote, type ContactField, type PlaceResult } from "@/lib/checkout-schema";
import { checkPromo, placeOrder } from "@/lib/actions/shop";
import { BackIcon, BoxIcon, CheckIcon, ShieldIcon, TruckIcon } from "./icons";
import "./checkout.css";

const PROMO = "AABSHAR5";
const OOPS = "Something went wrong. Please try again.";

/** The signed-in dealer, read on the server from the session cookie. */
export type CheckoutDealer = { name: string; phone: string; city: string; available: number; terms: number };

/** Checkout form: the shared contact schema plus the applied promo percentage (0 when none). */
const formSchema = contactSchema.extend({ promoPct: z.number().int().min(0).max(100) });
type Values = z.infer<typeof formSchema>;

/** Field rules that depend on the price mode, the delivery cities and the dealer's credit. */
function makeSchema(mode: Mode, cities: string[], total: (v: Values) => number, available: number) {
  return formSchema.superRefine((v, ctx) => {
    if (!cities.includes(v.city)) ctx.addIssue({ code: "custom", path: ["city"], message: "Choose a city from the list" });
    if (v.speed === "exp" && (mode === "dealer" || !nextDayCity(v.city)))
      ctx.addIssue({ code: "custom", path: ["speed"], message: "Next day delivery is only for Gujranwala and Lahore" });
    if (mode === "dealer" && v.pay !== "credit" && v.pay !== "bank")
      ctx.addIssue({ code: "custom", path: ["pay"], message: "Dealer orders are paid on credit or by bank transfer" });
    if (v.pay === "credit") {
      if (mode !== "dealer") ctx.addIssue({ code: "custom", path: ["pay"], message: "Credit is only for dealer accounts" });
      else if (total(v) > available)
        ctx.addIssue({ code: "custom", path: ["pay"], message: "This order is more than your available credit" });
    }
  });
}

type Done = Extract<PlaceResult, { ok: true }>;

/** "03016423718" -> "0301-6423718". */
const fmtPhone = (d: string) => (/^03\d{9}$/.test(d) ? d.slice(0, 4) + "-" + d.slice(4) : d);

export function Field({ id, label, reg, error, hint, ...attrs }: {
  id: string;
  label: string;
  reg: UseFormRegisterReturn;
  error?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={"fld" + (error ? " bad" : "")}>
      <label htmlFor={"co-" + id}>{label}</label>
      <input
        id={"co-" + id}
        {...attrs}
        {...reg}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "e-" + id : undefined}
      />
      {error ? <small className="err" id={"e-" + id}>{error}</small> : hint ? <small>{hint}</small> : null}
    </div>
  );
}

export function Checkout({ dealer }: { dealer: CheckoutDealer | null }) {
  const { t, rs, href, dateStr, lang } = useI18n();
  const { cart, mode: shopMode, setMode, clearCart, toast } = useShop();
  const { BY, ship } = useCatalog();
  const router = useRouter();
  const [done, setDone] = useState<Done | null>(null);
  // The cart is restored from storage after mount; wait for it before choosing the form or the empty state.
  const [ready, setReady] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- marks the first client render after hydration
  useEffect(() => setReady(true), []);

  // Dealer prices only with a dealer session; the server decides the same way.
  const mode: Mode = shopMode === "dealer" && dealer ? "dealer" : "retail";
  const needSignIn = shopMode === "dealer" && !dealer;
  const available = dealer?.available ?? 0;
  const cities = useMemo(() => Object.keys(ship), [ship]);
  const lines = useMemo(() => cart.filter((l) => BY[l.id]), [cart, BY]);

  // A signed-in dealer always orders at dealer prices, so show them (this also rounds lines to whole cartons).
  useEffect(() => {
    if (ready && dealer && shopMode !== "dealer") setMode("dealer");
  }, [ready, dealer, shopMode, setMode]);

  const schema = useMemo(
    () => makeSchema(mode, cities, (v) => quote(lines, BY, mode, { rates: ship, city: v.city, speed: mode === "dealer" ? "truck" : v.speed, pct: v.promoPct }).total, available),
    [mode, cities, lines, BY, ship, available],
  );
  const { register, handleSubmit, control, setValue, getValues, setError, formState: { errors, submitCount, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", phone: "", email: "", city: ship.Gujranwala ? "Gujranwala" : (cities[0] ?? ""), area: "", addr: "", mark: "",
      speed: "std", pay: "cod", promo: "", promoPct: 0,
    },
    reValidateMode: "onChange",
    shouldFocusError: true,
  });
  const [city, speed, pay, promoPct] = useWatch({ control, name: ["city", "speed", "pay", "promoPct"] });

  const tot = quote(lines, BY, mode, { rates: ship, city, speed: mode === "dealer" ? "truck" : speed, pct: promoPct });

  // Dealers pay on credit or by bank and always get the truck; credit is for dealers only.
  useEffect(() => {
    const p = getValues("pay");
    if (mode === "dealer") {
      if (p !== "credit" && p !== "bank") setValue("pay", available > 0 ? "credit" : "bank");
      if (getValues("speed") === "exp") setValue("speed", "std");
    } else if (p === "credit") setValue("pay", "cod");
  }, [mode, available, getValues, setValue]);

  // Fill the dealer's own details into empty fields.
  useEffect(() => {
    if (!dealer) return;
    if (!getValues("name")) setValue("name", dealer.name);
    if (!getValues("phone")) setValue("phone", fmtPhone(dealer.phone));
    if (cities.includes(dealer.city)) setValue("city", dealer.city);
  }, [dealer, cities, getValues, setValue]);

  const err = (k: ContactField) => {
    const m = errors[k]?.message;
    return m ? t(m) : undefined;
  };

  if (!ready) return <div className="col gut co" />;

  if (done) {
    const first = done.name.trim().split(/\s+/)[0];
    const steps: [string, string][] = [
      ["Order confirmed", dateStr(new Date(), true)],
      ["Packed at Gujranwala", t("Within 24 hours")],
      ["On the way", t("Rider calls before arrival")],
      ["Delivered", dateStr(new Date(done.eta), true)],
    ];
    const payLabel = PAYS.find((p) => p[0] === done.pay)?.[1] ?? "";
    return (
      <div className="col gut co">
        <div className="done">
          <span className="tick"><CheckIcon /></span>
          <span className="eyebrow" style={{ color: "var(--brass-text)" }}>{t("Order placed")}</span>
          <h1 className="display ph1">{t("Thank you,")} <span>{first}</span>{lang === "ur" ? "۔" : "."}</h1>
          <p>
            <span>{t("Order")}</span> <b className="mono" dir="ltr">{done.no}</b> · <span className="mono">{rs(done.total)}</span> · <span>{t(payLabel)}</span>
          </p>
          <p className="note"><span>{t("We sent a confirmation on WhatsApp to")}</span> <b className="mono" dir="ltr">{done.phone}</b></p>
          <ol className="track">
            {steps.map(([label, when], i) => (
              <li key={label} className={i === 0 ? "on" : ""}><i /><b>{t(label)}</b><small>{when}</small></li>
            ))}
          </ol>
          <div className="ctas" style={{ justifyContent: "center" }}>
            <Link className="btn dark" href={href("/")}>{t("Continue shopping")}</Link>
            <Link className="btn line" href={href("/track?no=" + encodeURIComponent(done.no))}>{t("Track this order")}</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="col gut co">
        <div className="done">
          <span className="tick muted"><BoxIcon /></span>
          <h1 className="display ph1">{t("Your cart is empty")}</h1>
          <p className="note">{t("Start with our best sellers or build a full bathroom set.")}</p>
          <div className="ctas" style={{ justifyContent: "center" }}>
            <Link className="btn dark" href={href("/shop")}>{t("View all products")}</Link>
            <Link className="btn line" href={href("/#best")}>{t("Shop best sellers")}</Link>
          </div>
        </div>
      </div>
    );
  }

  const shipDays = rateFor(ship, city).d;
  const eta = etaDate(mode !== "dealer" && speed === "exp" ? 1 : shipDays);
  const stdFee = shipFee(ship, city, tot.sub);
  const pays = PAYS.filter(([id]) => (mode === "dealer" ? id === "bank" || (id === "credit" && available > 0) : id !== "credit"));
  const placeLabel = pay === "cod" ? "Place order · pay on delivery" : pay === "credit" ? "Place order on credit" : "Place order and pay";
  const fieldErrors = CONTACT_FIELDS.some((k) => errors[k]);
  const banner = errors.root?.server?.message ?? (submitCount > 0 && fieldErrors ? t("Please check the highlighted fields") : null);
  const nameOf = (sku?: string) => (sku && BY[sku] ? productText(BY[sku], lang).name : (sku ?? ""));

  /** Server refusals: a field error, or a message in the banner. Stock and price changes reload the catalogue. */
  const showFailure = (r: Extract<PlaceResult, { ok: false }>) => {
    let msg: string;
    if (r.error === "stock") {
      msg = nameOf(r.sku) + ": " + (r.left ? `${t("Only")} ${r.left} ${t("left in stock")}` : t("Out of stock"));
      router.refresh();
    } else if (r.error === "unavailable") {
      msg = nameOf(r.sku) + ": " + t("no longer available");
      router.refresh();
    } else {
      msg = t(r.error);
      if (r.error.startsWith("Prices have changed")) router.refresh();
    }
    if (r.field) {
      setError(r.field, { message: r.error });
      if (r.field === "promo") setValue("promoPct", 0);
    }
    setError("root.server", { message: msg });
  };

  const onValid = async (v: Values) => {
    const res = await placeOrder({
      name: v.name, phone: v.phone, email: v.email, city: v.city, area: v.area, addr: v.addr, mark: v.mark,
      speed: v.speed, pay: v.pay, promo: v.promoPct ? v.promo : "",
      lines: lines.map(({ id, fin, qty }) => ({ id, fin, qty })),
      lang,
      seen: tot.total,
    }).catch(() => null);
    if (!res) return void setError("root.server", { message: t(OOPS) });
    if (!res.ok) return showFailure(res);
    setDone(res);
    clearCart();
    window.scrollTo(0, 0);
  };
  const onInvalid = () => toast("Please check the highlighted fields");

  const applyPromo = async () => {
    const res = await checkPromo(getValues("promo")).catch(() => ({ ok: false as const }));
    setValue("promoPct", res.ok ? res.pct : 0);
    // toast() translates; the 5% message is in the dictionary, other percentages are built from parts.
    toast(!res.ok ? "This code is not valid" : res.pct === 5 ? "Code applied: 5% off" : `${t("Code applied:")} ${res.pct}% ${t("off")}`);
  };

  return (
    <div className="col gut co">
      <div className="cohead">
        <Link className="back" href={href("/")}><BackIcon /><span>{t("Continue shopping")}</span></Link>
        <h1 className="display ph1">{t("Checkout")}</h1>
        <ol className="costeps">
          <li className="on"><i>1</i><span>{t("Details")}</span></li>
          <li className="on"><i>2</i><span>{t("Delivery")}</span></li>
          <li className="on"><i>3</i><span>{t("Payment")}</span></li>
        </ol>
      </div>
      <div className="cogrid">
        <form id="coform" noValidate onSubmit={handleSubmit(onValid, onInvalid)}>
          {needSignIn && (
            <div className="cobox">
              <p className="note credit">{t("Dealer prices need a dealer sign-in. Until then this order uses home prices.")}</p>
              <div className="ctas">
                <Link className="btn dark" href={href("/dealer")}>{t("Sign in to the dealer portal")}</Link>
                <button className="btn line" type="button" onClick={() => setMode("retail")}>{t("Order at home prices")}</button>
              </div>
            </div>
          )}

          <fieldset className="cobox">
            <legend><i>1</i><span>{t("Your details")}</span></legend>
            <div className="fgrid2">
              <Field id="name" label={t("Full name")} reg={register("name")} error={err("name")} autoComplete="name" required />
              <Field
                id="phone" label={t("Mobile number")} reg={register("phone")} error={err("phone")} hint={t("We confirm the order on WhatsApp")}
                type="tel" inputMode="tel" autoComplete="tel" placeholder="0300-1234567" dir="ltr" required
              />
              <Field id="email" label={t("Email (optional)")} reg={register("email")} error={err("email")} type="email" autoComplete="email" dir="ltr" />
            </div>
          </fieldset>

          <fieldset className="cobox">
            <legend><i>2</i><span>{t("Delivery address")}</span></legend>
            <div className="fgrid2">
              <div className={"fld" + (err("city") ? " bad" : "")}>
                <label htmlFor="co-city">{t("City")}</label>
                <select
                  id="co-city"
                  aria-invalid={err("city") ? true : undefined}
                  {...register("city", { onChange: (e) => { if (!nextDayCity(e.target.value)) setValue("speed", "std"); } })}
                >
                  {cities.map((c) => <option key={c} value={c}>{t(c)}</option>)}
                </select>
                {err("city") && <small className="err">{err("city")}</small>}
              </div>
              <Field id="area" label={t("Area or mohalla")} reg={register("area")} error={err("area")} autoComplete="address-level3" required />
              <Field id="addr" label={t("House number and street")} reg={register("addr")} error={err("addr")} autoComplete="street-address" required />
              <Field id="mark" label={t("Nearest landmark (optional)")} reg={register("mark")} />
            </div>
            {mode === "dealer" ? (
              <p className="note"><TruckIcon /> <span>{t("Dealer orders go on our own truck to your shop. No delivery charge.")}</span></p>
            ) : (
              <div className="radios" role="radiogroup" aria-label={t("Delivery speed")}>
                <label className={"rcard" + (speed === "std" ? " on" : "")}>
                  <input type="radio" value="std" {...register("speed")} />
                  <span><b>{t("Standard")}</b><small><span>{t("Arrives by")}</span> {dateStr(etaDate(shipDays), true)}</small></span>
                  <span className="mono">{stdFee ? rs(stdFee) : <span className="ok">{t("Free")}</span>}</span>
                </label>
                {nextDayCity(city) && (
                  <label className={"rcard" + (speed === "exp" ? " on" : "")}>
                    <input type="radio" value="exp" {...register("speed")} />
                    <span><b>{t("Next day")}</b><small>{t("Gujranwala and Lahore only")}</small></span>
                    <span className="mono">{rs(NEXT_DAY_FEE)}</span>
                  </label>
                )}
                {err("speed") && <small className="co-err" role="alert">{err("speed")}</small>}
              </div>
            )}
          </fieldset>

          <fieldset className="cobox">
            <legend><i>3</i><span>{t("Payment")}</span></legend>
            {mode === "dealer" && dealer && (
              <p className="note credit">
                <span>{dealer.name}</span> · <span>{t("Available credit")}</span>: <b className="mono">{rs(available)}</b> ·{" "}
                <span>{dealer.terms === 30 ? t("due in 30 days") : `${t("Payment due in")} ${dealer.terms} ${t("days")}`}</span>
              </p>
            )}
            <div className="radios">
              {pays.map(([id, label, desc]) => (
                <label key={id} className={"rcard" + (pay === id ? " on" : "")}>
                  <input type="radio" value={id} {...register("pay")} />
                  <span><b>{t(label)}</b><small>{t(desc)}</small></span>
                  <span className={"pm pm-" + id} aria-hidden="true" />
                </label>
              ))}
              {err("pay") && <small className="co-err" role="alert">{err("pay")}</small>}
            </div>
          </fieldset>

          {banner && <p className="co-alert" role="alert">{banner}</p>}
          <button className="btn dark full big" type="submit" disabled={isSubmitting}>
            <span>{t(placeLabel)}</span> · <span className="mono">{rs(tot.total)}</span>
          </button>
          <p className="note center"><ShieldIcon /> <span>{t("Payment is not taken online yet. We confirm every order on WhatsApp.")}</span></p>
        </form>

        <aside className="cosum">
          <h2>{t("Order summary")}</h2>
          {tot.lines.map((l, i) => {
            const p = BY[l.id];
            return (
              <div className="line" key={l.id + l.fin + i}>
                <Pic p={p} alt="" sizes="56px" />
                <div>
                  <b>{productText(p, lang).name}</b>
                  <small className="mono">{p.id}{l.fin ? " · " + t(FIN[l.fin].label) : ""}</small>
                  <br />
                  <small><span>{t("Qty")}</span> <span className="mono">{l.qty}</span></small>
                </div>
                <span className="mono">{rs(l.total)}</span>
              </div>
            );
          })}
          <div className="promo">
            <label htmlFor="co-promo" className="sr-only">{t("Promo code")}</label>
            <input
              id="co-promo"
              placeholder={t("Promo code")}
              dir="ltr"
              {...register("promo", { onChange: () => { if (getValues("promoPct")) setValue("promoPct", 0); } })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void applyPromo();
                }
              }}
            />
            <button type="button" className="btn line" onClick={() => void applyPromo()}>{t("Apply")}</button>
          </div>
          {promoPct > 0 ? (
            <p className="note ok">{t("Code applied:")} {promoPct}% {t("off")}</p>
          ) : (
            <p className="note">{t("Try code")} <b className="mono" dir="ltr">{PROMO}</b> {t("for 5% off")}</p>
          )}
          <div className="sum"><span>{t("Subtotal")}</span><span className="mono">{rs(tot.sub)}</span></div>
          {tot.disc > 0 && <div className="sum"><span>{t("Discount")}</span><span className="mono ok">− {rs(tot.disc)}</span></div>}
          <div className="sum"><span>{t("Delivery")}</span><span className="mono">{tot.fee ? rs(tot.fee) : <span className="ok">{t("Free")}</span>}</span></div>
          <div className="sum total"><span>{t("Total")}</span><span className="mono">{rs(tot.total)}</span></div>
          <p className="note"><span>{t("Arrives by")}</span> <b>{dateStr(eta, true)}</b></p>
        </aside>
      </div>
    </div>
  );
}
