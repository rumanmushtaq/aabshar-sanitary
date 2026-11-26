"use client";

import { useSsrForm } from "./use-ssr-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { deletePromo, deleteShipRate, deleteShop, savePromo, saveShipRate, saveShop } from "@/lib/actions/admin/settings";
import {
  promoSchema, shipRateSchema, shopSchema,
  type ActionResult, type PromoInput, type ShipRateInput, type ShopInput,
} from "@/lib/actions/admin/schemas";
import { ActionButton } from "./ui";

const NUM = { valueAsNumber: true } as const;
const RATE_COLS = "1.4fr .6fr .8fr 1.2fr 150px";
const SHOP_COLS = "1fr 1.4fr 1.2fr 1fr .5fr 150px";
const PROMO_COLS = "1.2fr .6fr .8fr 1.1fr 150px";

/** Shared submit handling: shows the error, or "Saved" briefly; clears the add row on success. */
function useRowSubmit<T>(run: (v: T) => Promise<ActionResult>, after: (v: T) => void) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const onValid = async (v: T) => {
    setMsg(null);
    const r = await run(v);
    if (r.ok) {
      after(v);
      setMsg({ ok: true, text: "Saved" });
    } else setMsg({ ok: false, text: r.error });
  };
  return { msg, onValid };
}

function Head({ cols, labels }: { cols: string; labels: string[] }) {
  return (
    <div className="erow head" style={{ "--cols": cols } as React.CSSProperties} aria-hidden="true">
      {labels.map((l, i) => <span key={i}>{l}</span>)}
    </div>
  );
}

export const RateHead = () => <Head cols={RATE_COLS} labels={["City", "Days", "Fee (Rs)", "Free delivery", ""]} />;
export const ShopHead = () => <Head cols={SHOP_COLS} labels={["City", "Shop", "Area", "Phone", "Sort", ""]} />;
export const PromoHead = () => <Head cols={PROMO_COLS} labels={["Code", "% off", "Status", "Expires", ""]} />;

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="ec"><span className="ml">{label}</span>{children}</label>;
}

function RowMsg({ msg, errors }: { msg: { ok: boolean; text: string } | null; errors: Record<string, { message?: string } | undefined> }) {
  const first = Object.values(errors).find((e) => e?.message)?.message;
  const text = first ?? msg?.text;
  if (!text) return null;
  return <div className={"err small " + (first || !msg?.ok ? "ferr" : "")} style={!first && msg?.ok ? { color: "var(--ok)" } : undefined}>{text}</div>;
}

/* ---------- delivery rates ---------- */

export function RateRow({ value }: { value?: ShipRateInput }) {
  const create = !value;
  const blank: ShipRateInput = { city: "", days: 2, fee: 250, freeOver: false };
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useSsrForm<ShipRateInput>({ resolver: zodResolver(shipRateSchema), defaultValues: value ?? blank });
  const { msg, onValid } = useRowSubmit((v: ShipRateInput) => saveShipRate(create ? "create" : "edit", v), (v) => reset(create ? blank : v));
  return (
    <form className={"erow" + (create ? " add" : "")} style={{ "--cols": RATE_COLS } as React.CSSProperties} onSubmit={handleSubmit(onValid)} noValidate>
      <Cell label="City"><input className="in sm" readOnly={!create} placeholder="New city" aria-label="City" {...register("city")} /></Cell>
      <Cell label="Days"><input className="in sm" type="number" aria-label="Days" {...register("days", NUM)} /></Cell>
      <Cell label="Fee (Rs)"><input className="in sm" type="number" aria-label="Fee" {...register("fee", NUM)} /></Cell>
      <label className="chk small"><input type="checkbox" {...register("freeOver")} />Free over threshold</label>
      <div className="ops">
        <button className={"b sm" + (create ? " pri" : "")} type="submit" disabled={isSubmitting || (!create && !isDirty)}>{create ? "Add" : "Save"}</button>
        {!create && <ActionButton action={deleteShipRate.bind(null, value.city)} label="Delete" className="b sm danger" confirm={`Remove delivery to ${value.city}? Customers there can no longer check out.`} />}
      </div>
      <RowMsg msg={msg} errors={errors} />
    </form>
  );
}

/* ---------- dealer shops ---------- */

export function ShopRow({ value }: { value?: ShopInput & { id: number } }) {
  const create = !value;
  const blank: ShopInput = { city: "", name: "", area: "", phone: "", sort: 0 };
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useSsrForm<ShopInput>({ resolver: zodResolver(shopSchema), defaultValues: value ?? blank });
  const { msg, onValid } = useRowSubmit((v: ShopInput) => saveShop(v), (v) => reset(create ? blank : v));
  return (
    <form className={"erow" + (create ? " add" : "")} style={{ "--cols": SHOP_COLS } as React.CSSProperties} onSubmit={handleSubmit(onValid)} noValidate>
      <Cell label="City"><input className="in sm" placeholder="City" aria-label="City" {...register("city")} /></Cell>
      <Cell label="Shop name"><input className="in sm" placeholder="Shop name" aria-label="Shop name" {...register("name")} /></Cell>
      <Cell label="Area"><input className="in sm" placeholder="Area / bazaar" aria-label="Area" {...register("area")} /></Cell>
      <Cell label="Phone"><input className="in sm mono" placeholder="Phone" aria-label="Phone" {...register("phone")} /></Cell>
      <Cell label="Sort"><input className="in sm" type="number" aria-label="Sort" {...register("sort", NUM)} /></Cell>
      <div className="ops">
        <button className={"b sm" + (create ? " pri" : "")} type="submit" disabled={isSubmitting || (!create && !isDirty)}>{create ? "Add" : "Save"}</button>
        {!create && <ActionButton action={deleteShop.bind(null, value.id)} label="Delete" className="b sm danger" confirm={`Remove ${value.name} from "Find a dealer"?`} />}
      </div>
      <RowMsg msg={msg} errors={errors} />
    </form>
  );
}

/* ---------- promo codes ---------- */

export function PromoRow({ value }: { value?: PromoInput }) {
  const create = !value;
  const blank: PromoInput = { code: "", pct: 5, active: true, expires: "" };
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useSsrForm<PromoInput>({ resolver: zodResolver(promoSchema), defaultValues: value ?? blank });
  const { msg, onValid } = useRowSubmit((v: PromoInput) => savePromo(create ? "create" : "edit", v), (v) => reset(create ? blank : v));
  return (
    <form className={"erow" + (create ? " add" : "")} style={{ "--cols": PROMO_COLS } as React.CSSProperties} onSubmit={handleSubmit(onValid)} noValidate>
      <Cell label="Code"><input className="in sm mono" readOnly={!create} placeholder="NEWCODE" aria-label="Code" style={{ textTransform: "uppercase" }} {...register("code")} /></Cell>
      <Cell label="% off"><input className="in sm" type="number" min={1} max={50} aria-label="Percent off" {...register("pct", NUM)} /></Cell>
      <label className="chk small"><input type="checkbox" {...register("active")} />Active</label>
      <Cell label="Expires (blank = never)"><input className="in sm" type="date" aria-label="Expires" {...register("expires")} /></Cell>
      <div className="ops">
        <button className={"b sm" + (create ? " pri" : "")} type="submit" disabled={isSubmitting || (!create && !isDirty)}>{create ? "Add" : "Save"}</button>
        {!create && <ActionButton action={deletePromo.bind(null, value.code)} label="Delete" className="b sm danger" confirm={`Delete code ${value.code}? Past orders keep it.`} />}
      </div>
      <RowMsg msg={msg} errors={errors} />
    </form>
  );
}
