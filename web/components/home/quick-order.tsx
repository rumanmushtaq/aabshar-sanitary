"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { productText } from "@/lib/i18n";
import { packOf } from "@/lib/pricing";
import { soldOut } from "@/components/product/catalog";
import { useCatalog, useI18n, useShop } from "@/components/providers";

const schema = z.object({
  sku: z.string().trim().min(1),
  n: z.number().int().min(1),
});
type Values = z.infer<typeof schema>;

/** Dealer quick order: type a SKU and a number of cartons. Shown in dealer mode only. */
export function QuickOrder() {
  const { t, lang } = useI18n();
  const { addItem, toast } = useShop();
  const { catalog, BY } = useCatalog();
  const { register, handleSubmit, reset, setFocus } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { sku: "", n: 1 },
  });

  const onSubmit = ({ sku, n }: Values) => {
    const id = sku.toUpperCase();
    const p = BY[id];
    if (!p) {
      toast("No product with SKU " + id);
      setFocus("sku");
      return;
    }
    if (soldOut(p)) {
      toast(t("Out of stock") + " · " + id);
      setFocus("sku");
      return;
    }
    addItem(id, undefined, n * p.carton, true);
    toast(`${n} ${packOf(p)}${n > 1 ? "s" : ""} of ${id} added`);
    reset({ sku: "", n: 1 });
    setFocus("sku");
  };

  return (
    <form className="qorder" id="qorder" data-show="dealer" autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
      <span className="lbl"><b>{t("Quick order")}</b><small>{t("Type a SKU and cartons")}</small></span>
      <label htmlFor="qo-sku" className="sr-only">{t("SKU")}</label>
      <input id="qo-sku" list="skus" placeholder={t("SKU, e.g. AB-7720")} required {...register("sku")} />
      <label htmlFor="qo-n" className="sr-only">{t("Cartons")}</label>
      <input id="qo-n" type="number" min={1} inputMode="numeric" required {...register("n", { valueAsNumber: true })} />
      <button className="btn dark" type="submit">{t("Add to order")}</button>
      <datalist id="skus">
        {catalog.map((p) => <option key={p.id} value={p.id}>{productText(p, lang).name}</option>)}
      </datalist>
    </form>
  );
}
