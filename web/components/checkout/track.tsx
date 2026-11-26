"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useI18n } from "@/components/providers";
import { trackSchema, type OrderStatus, type TrackResult, type TrackValues } from "@/lib/checkout-schema";
import { trackOrder } from "@/lib/actions/shop";
import { Field } from "./checkout";
import { BackIcon, BoxIcon, CheckIcon } from "./icons";
import "./checkout.css";

/** Timeline stages, as on the checkout success screen. */
const STAGES: [OrderStatus, string][] = [
  ["confirmed", "Order confirmed"],
  ["packed", "Packed at Gujranwala"],
  ["shipped", "On the way"],
  ["delivered", "Delivered"],
];
const STATUS_LABEL: Record<OrderStatus, string> = {
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Tracking form, prefilled from ?no=. Wrap in <Suspense> (it reads the search params). */
export function TrackFromUrl() {
  const no = useSearchParams().get("no") ?? "";
  return <TrackOrder initialNo={no.slice(0, 20)} />;
}

export function TrackOrder({ initialNo = "" }: { initialNo?: string }) {
  const { t, rs, href, dateStr } = useI18n();
  const [found, setFound] = useState<Extract<TrackResult, { ok: true }> | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<TrackValues>({
    resolver: zodResolver(trackSchema),
    defaultValues: { no: initialNo, phone: "" },
  });
  const err = (k: keyof TrackValues) => {
    const m = errors[k]?.message;
    return m ? t(m) : undefined;
  };

  const onValid = async (v: TrackValues) => {
    const res = await trackOrder(v).catch(() => null);
    if (!res) return void setError("root.server", { message: "Something went wrong. Please try again." });
    if (!res.ok) {
      setFound(null);
      return void setError("root.server", { message: res.error });
    }
    setFound(res);
  };

  // Latest event per status; stages up to the furthest one reached are marked done.
  const when = new Map<OrderStatus, string>((found?.events ?? []).map((e) => [e.status, e.at]));
  const reached = found ? Math.max(0, ...STAGES.map(([s], i) => (when.has(s) || s === found.status ? i : 0))) : -1;
  const cancelled = found?.status === "cancelled";

  return (
    <div className="col gut co">
      <div className="cohead">
        <Link className="back" href={href("/")}><BackIcon /><span>{t("Continue shopping")}</span></Link>
        <h1 className="display ph1">{t("Track your order")}</h1>
        <p className="note">{t("Enter the order number from your confirmation and the mobile number you ordered with.")}</p>
      </div>

      <form noValidate onSubmit={handleSubmit(onValid)} style={{ display: "grid", gap: 16, maxWidth: 640 }}>
        <fieldset className="cobox">
          <legend><i><BoxIcon width={14} height={14} /></i><span>{t("Your order")}</span></legend>
          <div className="fgrid2">
            <Field id="no" label={t("Order number")} reg={register("no")} error={err("no")} placeholder="AB-123456" dir="ltr" autoComplete="off" required />
            <Field
              id="phone" label={t("Mobile number")} reg={register("phone")} error={err("phone")}
              type="tel" inputMode="tel" autoComplete="tel" placeholder="0300-1234567" dir="ltr" required
            />
          </div>
        </fieldset>
        {errors.root?.server?.message && <p className="co-alert" role="alert">{t(errors.root.server.message)}</p>}
        <button className="btn dark full big" type="submit" disabled={isSubmitting}>{t("Track order")}</button>
      </form>

      {found && (
        <div className="done" aria-live="polite">
          <span className={"tick" + (cancelled ? " muted" : "")}>{cancelled ? <BoxIcon /> : <CheckIcon />}</span>
          <span className="eyebrow" style={{ color: "var(--brass-text)" }}>{t(STATUS_LABEL[found.status])}</span>
          <p>
            <span>{t("Order")}</span> <b className="mono" dir="ltr">{found.no}</b> · <span className="mono">{rs(found.total)}</span> ·{" "}
            <span>{t(`${found.pcs} pcs`)}</span>
          </p>
          <p className="note"><span>{t("Placed on")}</span> <b>{dateStr(new Date(found.created), true)}</b></p>
          {cancelled ? (
            <p className="note">{t("This order was cancelled. Call us if you have a question.")}</p>
          ) : (
            <ol className="track">
              {STAGES.map(([s, label], i) => {
                const at = when.get(s);
                return (
                  <li key={s} className={i <= reached ? "on" : ""}>
                    <i /><b>{t(label)}</b><small>{at ? dateStr(new Date(at), true) : " "}</small>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
