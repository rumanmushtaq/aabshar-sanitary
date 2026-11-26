"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useCatalog, useI18n, useShop } from "@/components/providers";
import type { FinishId } from "@/lib/data";
import type { ReorderLine } from "./data";

/** Button that shows a toast (stand-in for payments and chats). */
export function ToastButton({ msg, className, children }: { msg: string; className?: string; children: React.ReactNode }) {
  const { toast } = useShop();
  return <button className={className} type="button" onClick={() => toast(msg)}>{children}</button>;
}

/** Puts the last order's lines back in the cart at today's catalogue and opens checkout. Skips products no longer sold. */
export function ReorderButton({ label, lines }: { label: string; lines: ReorderLine[] }) {
  const { BY } = useCatalog();
  const { href } = useI18n();
  const { addItem, toast } = useShop();
  const router = useRouter();
  const ok = lines.filter((l) => BY[l.id] && l.qty > 0);
  const reorder = () => {
    let n = 0;
    for (const l of ok) {
      const p = BY[l.id];
      const fin = (p.fins as string[]).includes(l.fin) ? (l.fin as FinishId) : undefined;
      addItem(l.id, fin, l.qty, true);
      n += Math.ceil(l.qty / p.carton);
    }
    toast(`${n} cartons added to your order`);
    router.push(href("/checkout"));
  };
  return <button className="btn dark full" type="button" style={{ marginTop: 12 }} disabled={!ok.length} onClick={reorder}>{label}</button>;
}

const noSubscribe = () => () => {};

/** Days until the next payment ("YYYY-MM-DD", Pakistan time), counted in the browser. */
export function DaysLeft({ due }: { due: string }) {
  const days = useSyncExternalStore(
    noSubscribe,
    () => Math.max(0, Math.ceil((new Date(due + "T00:00:00+05:00").getTime() - Date.now()) / 864e5)),
    () => null,
  );
  return <span className="mono">{days ?? "–"}</span>;
}
