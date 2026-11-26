"use client";

import { useSsrForm } from "./use-ssr-form";
import { useState } from "react";
import { useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { setOrderStatus } from "@/lib/actions/admin/orders";
import { ORDER_STATUSES, statusSchema, type StatusInput } from "@/lib/actions/admin/schemas";
import { Field, Msg } from "./bits";
import { STATUS_LABEL } from "./format";

const NEXT: Record<string, string> = { confirmed: "packed", packed: "shipped", shipped: "delivered" };
const allowed = (cur: string) => ORDER_STATUSES.filter((s) => s !== cur && !(cur === "delivered" && s === "cancelled"));
const suggest = (cur: string) => (NEXT[cur] ?? allowed(cur)[0]) as StatusInput["status"];

export function OrderStatusForm({ id, current, dealerCredit }: { id: number; current: string; dealerCredit: boolean }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const options = allowed(current);
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useSsrForm<StatusInput>({
    resolver: zodResolver(statusSchema),
    defaultValues: { id, status: suggest(current), note: "" },
  });
  const status = useWatch({ control, name: "status" });

  if (current === "cancelled") return <p className="muted" style={{ margin: 0 }}>This order is cancelled. Stock was returned.</p>;
  if (!options.length) return null;

  const submit = handleSubmit(async (v) => {
    if (v.status === "cancelled") {
      const extra = dealerCredit ? " The amount still owed on it will be credited back to the dealer's khata." : "";
      if (!window.confirm(`Cancel this order? Its stock goes back on the shelf.${extra}`)) return;
    }
    setMsg(null);
    const r = await setOrderStatus(v);
    if (r.ok) {
      setMsg({ ok: true, text: r.msg ?? "Saved." });
      reset({ id, status: suggest(v.status), note: "" });
    } else setMsg({ ok: false, text: r.error });
  });

  return (
    <form className="f" onSubmit={submit} noValidate>
      <Msg ok={msg?.ok ?? true} text={msg?.text} />
      <Field label="New status" error={errors.status?.message}>
        <select className="in" {...register("status")}>
          {options.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </Field>
      <Field label="Note (optional)" hint="Shown on the timeline, e.g. courier and tracking number." error={errors.note?.message}>
        <textarea className="in" rows={2} {...register("note")} />
      </Field>
      {status === "cancelled" && (
        <p className="small" style={{ margin: 0, color: "var(--bad)" }}>
          Cancelling returns the items to stock{dealerCredit ? " and credits the dealer's khata" : ""}. It cannot be undone.
        </p>
      )}
      <button className={"b " + (status === "cancelled" ? "danger" : "pri")} type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : status === "cancelled" ? "Cancel order" : `Mark as ${STATUS_LABEL[status ?? ""]?.toLowerCase() ?? "…"}`}
      </button>
    </form>
  );
}

export function PrintButton() {
  return <button className="b pri" type="button" onClick={() => window.print()}>Print</button>;
}
