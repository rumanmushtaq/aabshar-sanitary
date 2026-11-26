"use client";

import { useSsrForm } from "./use-ssr-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDealer, recordPayment, resetDealerPin, updateDealer } from "@/lib/actions/admin/dealers";
import {
  PAY_METHODS, TIERS, dealerCreateSchema, dealerEditSchema, paymentSchema, pinSchema,
  type DealerCreateInput, type DealerEditInput, type PaymentInput, type PinInput,
} from "@/lib/actions/admin/schemas";
import { Field, Msg } from "./bits";

const NUM = { valueAsNumber: true } as const;
type M = { ok: boolean; text: string } | null;
// Both forms hold every field of Base, so their register() fits the shared fields component.
type Base = Omit<DealerEditInput, "id">;

/* ---------- create / edit ---------- */

type DealerFormProps =
  | { mode: "create"; isAdmin: true; values?: undefined }
  | { mode: "edit"; isAdmin: boolean; values: DealerEditInput };

export function DealerForm(props: DealerFormProps) {
  return props.mode === "create" ? <CreateDealer /> : <EditDealer values={props.values} isAdmin={props.isAdmin} />;
}

function CreateDealer() {
  const router = useRouter();
  const [msg, setMsg] = useState<M>(null);
  const form = useForm<DealerCreateInput>({
    resolver: zodResolver(dealerCreateSchema),
    defaultValues: { name: "", initials: "", city: "Gujranwala", phone: "", pin: "", tier: "B", since: new Date().getFullYear(), creditLimit: 500000, termsDays: 30, manager: "" },
  });
  const submit = form.handleSubmit(async (v) => {
    setMsg(null);
    const r = await createDealer(v);
    if (r.ok) router.push(`/admin/dealers/${r.id}`);
    else setMsg({ ok: false, text: r.error });
  });
  return (
    <form className="f card" onSubmit={submit} noValidate style={{ maxWidth: 760 }}>
      <Msg ok={msg?.ok ?? true} text={msg?.text} />
      <DealerFields register={form.register as unknown as UseFormRegister<Base>} errors={form.formState.errors} isAdmin />
      <Field label="Login PIN" hint="4 to 6 digits. Tell the dealer; it is stored hashed and cannot be read back." error={form.formState.errors.pin?.message}>
        <input className="in mono" style={{ maxWidth: 160 }} inputMode="numeric" autoComplete="off" {...form.register("pin")} />
      </Field>
      <div className="factions"><button className="b pri" type="submit" disabled={form.formState.isSubmitting}>Add dealer</button></div>
    </form>
  );
}

function EditDealer({ values, isAdmin }: { values: DealerEditInput; isAdmin: boolean }) {
  const [msg, setMsg] = useState<M>(null);
  const form = useSsrForm<DealerEditInput>({ resolver: zodResolver(dealerEditSchema), defaultValues: values });
  const submit = form.handleSubmit(async (v) => {
    setMsg(null);
    const r = await updateDealer(v);
    setMsg(r.ok ? { ok: true, text: r.msg ?? "Saved." } : { ok: false, text: r.error });
    if (r.ok) form.reset(v);
  });
  return (
    <form className="f" onSubmit={submit} noValidate>
      <Msg ok={msg?.ok ?? true} text={msg?.text} />
      <DealerFields register={form.register as unknown as UseFormRegister<Base>} errors={form.formState.errors} isAdmin={isAdmin} />
      <div className="factions"><button className="b pri" type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>Save dealer</button></div>
    </form>
  );
}



/** Fields shared by the create and edit forms. */
function DealerFields({ register, errors, isAdmin }: { register: UseFormRegister<Base>; errors: FieldErrors<Base>; isAdmin: boolean }) {
  const err = (k: keyof Base) => errors[k]?.message;
  return (
    <>
      <div className="fg g3">
        <Field label="Shop name" error={err("name")}><input className="in" aria-invalid={!!errors.name} {...register("name")} /></Field>
        <Field label="Initials" hint="Shown in the avatar" error={err("initials")}><input className="in mono" maxLength={3} {...register("initials")} /></Field>
        <Field label="City" error={err("city")}><input className="in" {...register("city")} /></Field>
        <Field label="Mobile (login)" hint="03001234567" error={err("phone")}><input className="in mono" inputMode="tel" {...register("phone")} /></Field>
        <Field label="Area manager" error={err("manager")}><input className="in" {...register("manager")} /></Field>
        <Field label="Tier" error={err("tier")}>
          <select className="in" {...register("tier")}>{TIERS.map((t) => <option key={t} value={t}>Tier {t}</option>)}</select>
        </Field>
        <Field label="Dealer since (year)" error={err("since")}><input className="in" type="number" inputMode="numeric" {...register("since", NUM)} /></Field>
      </div>
      <div className="fg g3">
        <Field label="Credit limit (Rs)" hint={isAdmin ? undefined : "Admin only"} error={err("creditLimit")}>
          <input className="in" type="number" inputMode="numeric" readOnly={!isAdmin} {...register("creditLimit", NUM)} />
        </Field>
        <Field label="Payment terms (days)" hint={isAdmin ? undefined : "Admin only"} error={err("termsDays")}>
          <input className="in" type="number" inputMode="numeric" readOnly={!isAdmin} {...register("termsDays", NUM)} />
        </Field>
      </div>
    </>
  );
}

/* ---------- reset PIN ---------- */

export function PinForm({ id }: { id: number }) {
  const [msg, setMsg] = useState<M>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PinInput>({ resolver: zodResolver(pinSchema), defaultValues: { id, pin: "" } });
  const submit = handleSubmit(async (v) => {
    if (!window.confirm("Set this new PIN? The dealer will be signed out on every device.")) return;
    setMsg(null);
    const r = await resetDealerPin(v);
    setMsg(r.ok ? { ok: true, text: r.msg ?? "PIN changed." } : { ok: false, text: r.error });
    if (r.ok) reset({ id, pin: "" });
  });
  return (
    <form className="f" onSubmit={submit} noValidate>
      <Msg ok={msg?.ok ?? true} text={msg?.text} />
      <div className="inline" style={{ alignItems: "flex-start" }}>
        <Field label="New PIN" error={errors.pin?.message}><input className="in mono" style={{ width: 130 }} inputMode="numeric" autoComplete="off" {...register("pin")} /></Field>
        <button className="b" type="submit" disabled={isSubmitting} style={{ marginTop: 22 }}>Set PIN</button>
      </div>
    </form>
  );
}

/* ---------- record a payment ---------- */

export function PaymentForm({ dealerId, today }: { dealerId: number; today: string }) {
  const [msg, setMsg] = useState<M>(null);
  const blank: PaymentInput = { dealerId, amount: NaN, method: "Bank", ref: "", day: today, note: "" };
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PaymentInput>({ resolver: zodResolver(paymentSchema), defaultValues: blank });
  const submit = handleSubmit(async (v) => {
    if (!window.confirm(`Record a payment of Rs ${v.amount.toLocaleString("en-PK")} by ${v.method}?`)) return;
    setMsg(null);
    const r = await recordPayment(v);
    setMsg(r.ok ? { ok: true, text: r.msg ?? "Recorded." } : { ok: false, text: r.error });
    if (r.ok) reset(blank);
  });
  return (
    <form className="f" onSubmit={submit} noValidate>
      <Msg ok={msg?.ok ?? true} text={msg?.text} />
      <div className="fg g2">
        <Field label="Amount (Rs)" error={errors.amount?.message}><input className="in" type="number" inputMode="numeric" min={1} {...register("amount", NUM)} /></Field>
        <Field label="Method" error={errors.method?.message}>
          <select className="in" {...register("method")}>{PAY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</select>
        </Field>
        <Field label="Date received" error={errors.day?.message}><input className="in" type="date" max={today} {...register("day")} /></Field>
        <Field label="Reference" hint="Slip / transaction no. Blank = auto" error={errors.ref?.message}><input className="in mono" {...register("ref")} /></Field>
      </div>
      <Field label="Note (optional)" hint="e.g. Meezan Bank, Gujranwala branch" error={errors.note?.message}><input className="in" {...register("note")} /></Field>
      <div className="factions"><button className="b brass" type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Record payment"}</button></div>
    </form>
  );
}
