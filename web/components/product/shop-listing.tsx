"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Product } from "@/lib/data";
import type { Mode } from "@/lib/pricing";
import { useCatalog, useI18n, useShop } from "@/components/providers";
import { ProductCard } from "./product-card";
import { BoxIcon } from "./product-icons";
import { catSlug, catsOf } from "./catalog";
import "./shop.css";

const SORTS = ["featured", "low", "high"] as const;
type Sort = (typeof SORTS)[number];
const sortSchema = z.object({ sort: z.enum(SORTS) });
type SortForm = z.infer<typeof sortSchema>;

const SORT_LABEL: Record<Sort, string> = {
  featured: "Featured",
  low: "Price: low to high",
  high: "Price: high to low",
};

/** Price the shopper sees on the card: retail, or the first dealer slab. */
const shown = (p: Product, mode: Mode) => (mode === "dealer" ? p.slabs[0] : p.price);

/** Listing driven by ?cat=<slug>. Wrap in <Suspense> (it reads the search params). */
export function ShopListing() {
  const params = useSearchParams();
  const pathname = usePathname();
  const cat = params.get("cat") ?? "";

  // The URL is the state; Next keeps useSearchParams in sync with history.pushState.
  const pick = (slug: string) => {
    const q = new URLSearchParams(params.toString());
    if (slug) q.set("cat", slug);
    else q.delete("cat");
    const s = q.toString();
    window.history.pushState(null, "", s ? `${pathname}?${s}` : pathname);
  };

  return <ShopView cat={cat} onPick={pick} />;
}

/** The listing itself. Without onPick (the prerendered fallback) it shows every product. */
export function ShopView({ cat = "", onPick }: { cat?: string; onPick?: (slug: string) => void }) {
  const { t } = useI18n();
  const { mode } = useShop();
  const { catalog } = useCatalog();
  const CATS = catsOf(catalog);
  const { register, control } = useForm<SortForm>({ resolver: zodResolver(sortSchema), defaultValues: { sort: "featured" } });
  const sort = useWatch({ control, name: "sort" });

  const current = CATS.find((c) => catSlug(c) === cat);
  const list = catalog.filter((p) => !cat || p.cat === current);
  if (sort !== "featured") list.sort((a, b) => (shown(a, mode) - shown(b, mode)) * (sort === "low" ? 1 : -1));
  const n = list.length;

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">{t("Factory direct from Gujranwala")}</span>
          <h1 className="display h2" style={{ marginTop: 14 }}>{t(current ?? "All products")}</h1>
          <p>{n} {t(n === 1 ? "product" : "products")}</p>
        </div>
        <label className="shop-sort">
          <span>{t("Sort by")}</span>
          <select {...register("sort")}>
            {SORTS.map((s) => <option key={s} value={s}>{t(SORT_LABEL[s])}</option>)}
          </select>
        </label>
      </div>

      <div className="ptabs" role="tablist" aria-label={t("Categories")}>
        {["", ...CATS].map((c) => {
          const slug = c ? catSlug(c) : "";
          return (
            <button key={slug || "all"} type="button" role="tab" aria-selected={slug === cat} onClick={() => onPick?.(slug)}>
              {t(c || "All")}
            </button>
          );
        })}
      </div>

      {n ? (
        <div className="rail shop-grid" role="tabpanel" aria-label={t(current ?? "All products")}>
          {list.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      ) : (
        <div className="empty" role="tabpanel">
          <BoxIcon />
          <p>{t("No products in this category yet.")}</p>
          <button className="btn line" type="button" onClick={() => onPick?.("")}>{t("View all products")}</button>
        </div>
      )}
    </>
  );
}
