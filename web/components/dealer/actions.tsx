"use client";

import { useSyncExternalStore } from "react";
import { useShop } from "@/components/providers";
import { BY, LAST } from "@/lib/data";
import { DUE } from "./data";

/** Button that shows a toast (demo stand-in for downloads, payments and chats). */
export function ToastButton({ msg, className, children }: { msg: string; className?: string; children: React.ReactNode }) {
  const { toast } = useShop();
  return <button className={className} type="button" onClick={() => toast(msg)}>{children}</button>;
}

/** Adds the dealer's last order to the cart and opens it. */
export function ReorderButton({ label }: { label: string }) {
  const { addItem, openOverlay, toast } = useShop();
  const reorder = () => {
    let n = 0;
    for (const [id, ctn] of LAST) {
      addItem(id, undefined, ctn * BY[id].carton, true);
      n += ctn;
    }
    openOverlay("cart");
    toast(`${n} cartons added to your order`);
  };
  return <button className="btn dark full" type="button" style={{ marginTop: 12 }} onClick={reorder}>{label}</button>;
}

const noSubscribe = () => () => {};
const daysToDue = () => Math.max(0, Math.ceil((DUE.getTime() - Date.now()) / 864e5));

/** Days until the next payment, counted in the browser (the page itself is static). */
export function DaysLeft() {
  const days = useSyncExternalStore(noSubscribe, daysToDue, () => null);
  return <span className="mono">{days ?? "–"}</span>;
}
