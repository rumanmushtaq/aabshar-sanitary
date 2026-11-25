"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useI18n, useShop } from "@/components/providers";
import { Pic } from "@/components/product/pic";
import { BY, DEALER, FIN, PAYS, SHIP, type PayId } from "@/lib/data";
import { cartSum, unitPrice, type CartLine, type Mode } from "@/lib/pricing";
import { etaDate, shipFee } from "@/lib/shipping";
import { BackIcon, BoxIcon, CheckIcon, ShieldIcon, TruckIcon } from "./icons";
import "./checkout.css";

const MOBILE = /^03\d{2}-?\d{7}$/;
const PROMO = "AABSHAR5";
const NEXT_DAY_FEE = 450;
const AVAILABLE = DEALER.limit - DEALER.used;
const nextDayCity = (c: string) => c === "Gujranwala" || c === "Lahore";
/** Demo order number from the clock. */
const orderNo = () => "AB-" + String(Date.now()).slice(-6);

const base = z.object({
  name: z.string().refine((v) => v.trim().length >= 3, "Enter your full name"),
  phone: z.string().refine((v) => MOBILE.test(v.replace(/\s/g, "")), "Enter a mobile number like 0300-1234567"),
  email: z.string().refine((v) => !v || /^\S+@\S+\.\S+$/.test(v), "Check this email address"),
  city: z.string().refine((v) => v in SHIP, "Choose a city from the list"),
  area: z.string().refine((v) => v.trim().length >= 2, "Enter your area"),
  addr: z.string().refine((v) => v.trim().length >= 4, "Enter your house number and street"),
  mark: z.string(),
  speed: z.enum(["std", "exp"]),
  pay: z.enum(["cod", "jazz", "easy", "bank", "credit"]),
  promo: z.string(),
  promoOk: z.boolean(),
});
type Values = z.infer<typeof base>;

function totals(cart: CartLine[], mode: Mode, v: Pick<Values, "city" | "speed" | "promoOk">) {
  const sub = cartSum(cart, mode);
  const disc = v.promoOk ? Math.round(sub * 0.05) : 0;
  const fee = mode === "dealer" ? 0 : v.speed === "exp" ? NEXT_DAY_FEE : shipFee(v.city, sub);
  return { sub, disc, fee, total: sub - disc + fee };
}

/** Field rules that depend on the price mode and the order total. */
function makeSchema(cart: CartLine[], mode: Mode) {
  return base.superRefine((v, ctx) => {
    if (v.speed === "exp" && (mode === "dealer" || !nextDayCity(v.city)))
      ctx.addIssue({ code: "custom", path: ["speed"], message: "Next day delivery is only for Gujranwala and Lahore" });
    if (v.pay === "credit") {
      if (mode !== "dealer") ctx.addIssue({ code: "custom", path: ["pay"], message: "Credit is only for dealer accounts" });
      else if (totals(cart, mode, v).total > AVAILABLE)
        ctx.addIssue({ code: "custom", path: ["pay"], message: "This order is more than your available credit" });
    }
  });
}

type Done = { no: string; total: number; name: string; phone: string; pay: PayId; eta: Date };

function Field({ id, label, reg, error, hint, ...attrs }: {
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

export function Checkout() {
  const { t, rs, href, dateStr, lang } = useI18n();
  const { cart, mode, clearCart, toast } = useShop();
  const [done, setDone] = useState<Done | null>(null);
  // The cart is restored from storage after mount; wait for it before choosing the form or the empty state.
  const [ready, setReady] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- marks the first client render after hydration
  useEffect(() => setReady(true), []);

  const schema = useMemo(() => makeSchema(cart, mode), [cart, mode]);
  const { register, handleSubmit, control, setValue, getValues, formState: { errors, submitCount } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", phone: "", email: "", city: "Gujranwala", area: "", addr: "", mark: "",
      speed: "std", pay: "cod", promo: "", promoOk: false,
    },
    reValidateMode: "onChange",
    shouldFocusError: true,
  });
  const [city, speed, pay, promoOk] = useWatch({ control, name: ["city", "speed", "pay", "promoOk"] });

  // Credit is for dealers only, and dealers always get the truck (no next-day option).
  useEffect(() => {
    if (mode !== "dealer" && getValues("pay") === "credit") setValue("pay", "cod");
    if (mode === "dealer" && getValues("speed") === "exp") setValue("speed", "std");
  }, [mode, getValues, setValue]);

  const err = (k: keyof Values) => {
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
      ["Delivered", dateStr(done.eta, true)],
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
            <button className="btn line" type="button" onClick={() => toast("Tracking opens on WhatsApp and in your account")}>{t("Track this order")}</button>
          </div>
        </div>
      </div>
    );
  }

  if (!cart.length) {
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

  const tot = totals(cart, mode, { city, speed, promoOk });
  const shipDays = (SHIP[city] ?? SHIP.Lahore).d;
  const eta = etaDate(mode !== "dealer" && speed === "exp" ? 1 : shipDays);
  const stdFee = shipFee(city, tot.sub);
  const pays = PAYS.filter((p) => p[0] !== "credit" || (mode === "dealer" && AVAILABLE > 0));
  const placeLabel = pay === "cod" ? "Place order · pay on delivery" : pay === "credit" ? "Place order on credit" : "Place order and pay";
  const showBanner = submitCount > 0 && Object.keys(errors).length > 0;

  const onValid = (v: Values) => {
    setDone({ no: orderNo(), total: tot.total, name: v.name, phone: v.phone, pay: v.pay, eta });
    clearCart();
    window.scrollTo(0, 0);
  };
  const onInvalid = () => toast("Please check the highlighted fields");

  const applyPromo = () => {
    const ok = getValues("promo").trim().toUpperCase() === PROMO;
    setValue("promoOk", ok);
    toast(ok ? "Code applied: 5% off" : "This code is not valid");
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
              <div className="fld">
                <label htmlFor="co-city">{t("City")}</label>
                <select
                  id="co-city"
                  {...register("city", { onChange: (e) => { if (!nextDayCity(e.target.value)) setValue("speed", "std"); } })}
                >
                  {Object.keys(SHIP).map((c) => <option key={c} value={c}>{t(c)}</option>)}
                </select>
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
            {mode === "dealer" && (
              <p className="note credit">
                <span>{t("Available credit")}</span>: <b className="mono">{rs(AVAILABLE)}</b> · <span>{t("due in 30 days")}</span>
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

          {showBanner && <p className="co-alert" role="alert">{t("Please check the highlighted fields")}</p>}
          <button className="btn dark full big" type="submit">
            <span>{t(placeLabel)}</span> · <span className="mono">{rs(tot.total)}</span>
          </button>
          <p className="note center"><ShieldIcon /> <span>{t("Demo checkout. No payment is taken and nothing is sent.")}</span></p>
        </form>

        <aside className="cosum">
          <h2>{t("Order summary")}</h2>
          {cart.map((l, i) => {
            const p = BY[l.id];
            return (
              <div className="line" key={l.id + l.fin + i}>
                <Pic p={p} alt="" sizes="56px" />
                <div>
                  <b>{t(p.name)}</b>
                  <small className="mono">{p.id}{l.fin ? " · " + t(FIN[l.fin].label) : ""}</small>
                  <br />
                  <small><span>{t("Qty")}</span> <span className="mono">{l.qty}</span></small>
                </div>
                <span className="mono">{rs(unitPrice(p, l.fin, l.qty, mode) * l.qty)}</span>
              </div>
            );
          })}
          <div className="promo">
            <label htmlFor="co-promo" className="sr-only">{t("Promo code")}</label>
            <input
              id="co-promo"
              placeholder={t("Promo code")}
              dir="ltr"
              {...register("promo")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyPromo();
                }
              }}
            />
            <button type="button" className="btn line" onClick={applyPromo}>{t("Apply")}</button>
          </div>
          {promoOk ? (
            <p className="note ok">{t("Code applied: 5% off")}</p>
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
