"use client";

import { useSsrForm } from "./use-ssr-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { adjustStock, saveProduct } from "@/lib/actions/admin/products";
import { FIN_IDS, productSchema, type ProductInput } from "@/lib/actions/admin/schemas";
import { FIN } from "@/lib/data";
import { Field, Msg } from "./bits";

const EMPTY: ProductInput = {
  id: "", name: "", nameUr: "", cat: "", sub: "", subUr: "", price: 0, was: 0, carton: 1, slabs: [0, 0, 0],
  flag: "", sale: false, fins: [], specs: "", specsUr: "", pt: "", pack: "", wty: "", tags: "",
  img: "", alt: "", cimg: "", pos: "", crop: "", stock: 0, active: true, sort: 0,
};

const NUM = { valueAsNumber: true } as const;

export function ProductForm({ mode, values, cats, images }: { mode: "create" | "edit"; values?: ProductInput; cats: string[]; images: string[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { register, handleSubmit, control, formState: { errors, isSubmitting, isDirty }, reset } = useSsrForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: values ?? EMPTY,
  });
  const [img, alt, cimg, crop] = useWatch({ control, name: ["img", "alt", "cimg", "crop"] });

  const submit = handleSubmit(
    async (v) => {
      setMsg(null);
      const r = await saveProduct(mode, v);
      if (!r.ok) return setMsg({ ok: false, text: r.error });
      if (mode === "create") router.push(`/admin/products/${encodeURIComponent(String(r.id))}`);
      else {
        setMsg({ ok: true, text: r.msg ?? "Saved." });
        reset(v);
      }
    },
    () => setMsg({ ok: false, text: "Some fields need attention. See the red notes below." }),
  );

  const e = errors;
  const imgOptions = (
    <>
      <option value="">None</option>
      {images.map((f) => <option key={f} value={f}>{f.replace("/img/", "")}</option>)}
    </>
  );

  return (
    <form className="f" onSubmit={submit} noValidate>
      <Msg ok={msg?.ok ?? true} text={msg?.text} />
      <div className="cols">
        <div className="stack">
          <fieldset className="fs">
            <legend>Basics</legend>
            <div className="f">
              <div className="fg g3">
                <Field label="SKU" hint={mode === "edit" ? "Cannot change" : "e.g. AB-1204"} error={e.id?.message}>
                  <input className="in mono" readOnly={mode === "edit"} aria-invalid={!!e.id} {...register("id")} />
                </Field>
                <Field label="Category" error={e.cat?.message}>
                  <input className="in" list="adm-cats" aria-invalid={!!e.cat} {...register("cat")} />
                </Field>
                <Field label="Badge" hint="e.g. New, Top seller" error={e.flag?.message}>
                  <input className="in" {...register("flag")} />
                </Field>
              </div>
              <datalist id="adm-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
              <Field label="Name (English)" error={e.name?.message}>
                <input className="in" aria-invalid={!!e.name} {...register("name")} />
              </Field>
              <Field label="Subtitle (English)" hint="One line under the name" error={e.sub?.message}>
                <input className="in" {...register("sub")} />
              </Field>
              <Field label="Specs (English)" hint="One per line" error={e.specs?.message}>
                <textarea className="in" rows={4} {...register("specs")} />
              </Field>
              <div className="fg g2">
                <Field label="Warranty" hint="e.g. 5-year warranty" error={e.wty?.message}>
                  <input className="in" {...register("wty")} />
                </Field>
                <Field label="Search tags" hint="Extra words people search for" error={e.tags?.message}>
                  <input className="in" {...register("tags")} />
                </Field>
              </div>
            </div>
          </fieldset>

          <fieldset className="fs ur-box">
            <legend>Urdu text (shown on /ur pages)</legend>
            <div className="f">
              <Field label={<>Name in Urdu <em>اردو نام</em></>} hint="Leave empty to use the shop dictionary" error={e.nameUr?.message}>
                <input className="in" dir="rtl" lang="ur" {...register("nameUr")} />
              </Field>
              <Field label={<>Subtitle in Urdu <em>ذیلی سطر</em></>} error={e.subUr?.message}>
                <input className="in" dir="rtl" lang="ur" {...register("subUr")} />
              </Field>
              <Field label={<>Specs in Urdu <em>تفصیلات</em></>} hint="One per line, same order as the English specs" error={e.specsUr?.message}>
                <textarea className="in" dir="rtl" lang="ur" rows={4} {...register("specsUr")} />
              </Field>
            </div>
          </fieldset>

          <fieldset className="fs">
            <legend>Finishes / colours</legend>
            <div className="chks">
              {FIN_IDS.map((k) => (
                <label key={k} className="chk"><input type="checkbox" value={k} defaultChecked={values?.fins?.includes(k)} {...register("fins")} />{FIN[k].label}{FIN[k].mult !== 1 && <span className="small muted">×{FIN[k].mult}</span>}</label>
              ))}
            </div>
            {e.fins && <div className="ferr">Pick finishes from the list.</div>}
          </fieldset>
        </div>

        <div className="stack">
          <fieldset className="fs">
            <legend>Prices (rupees)</legend>
            <div className="f">
              <div className="fg g2">
                <Field label="Home price / pc" error={e.price?.message}><input className="in" type="number" inputMode="numeric" {...register("price", NUM)} /></Field>
                <Field label="Old price" hint="0 = none" error={e.was?.message}><input className="in" type="number" inputMode="numeric" {...register("was", NUM)} /></Field>
              </div>
              <label className="chk"><input type="checkbox" {...register("sale")} />On sale</label>
              <div className="lbl">Dealer price per piece</div>
              <div className="fg g3">
                <Field label="1–4 ctn" error={e.slabs?.[0]?.message}><input className="in" type="number" inputMode="numeric" {...register("slabs.0", NUM)} /></Field>
                <Field label="5–19 ctn" error={e.slabs?.[1]?.message}><input className="in" type="number" inputMode="numeric" {...register("slabs.1", NUM)} /></Field>
                <Field label="20+ ctn" error={e.slabs?.[2]?.message}><input className="in" type="number" inputMode="numeric" {...register("slabs.2", NUM)} /></Field>
              </div>
              {e.slabs?.message && <div className="ferr">{e.slabs.message}</div>}
            </div>
          </fieldset>

          <fieldset className="fs">
            <legend>Packing & stock</legend>
            <div className="f">
              <div className="fg g2">
                <Field label="Pieces per carton" error={e.carton?.message}><input className="in" type="number" inputMode="numeric" {...register("carton", NUM)} /></Field>
                <Field label="Pack" error={e.pack?.message}>
                  <select className="in" {...register("pack")}>
                    <option value="">Carton (default)</option><option value="carton">Carton</option><option value="bundle">Bundle</option><option value="tank">Tank</option>
                  </select>
                </Field>
                <Field label="Stock (pieces)" error={e.stock?.message}><input className="in" type="number" inputMode="numeric" {...register("stock", NUM)} /></Field>
                <Field label="Plastic tab" error={e.pt?.message}>
                  <select className="in" {...register("pt")}>
                    <option value="">Not plastic</option><option value="tanks">Tanks</option><option value="pipes">Pipes</option><option value="home">Home</option>
                  </select>
                </Field>
                <Field label="Sort order" hint="Lower shows first" error={e.sort?.message}><input className="in" type="number" inputMode="numeric" {...register("sort", NUM)} /></Field>
              </div>
              <label className="chk"><input type="checkbox" {...register("active")} />Active (shown in the shop)</label>
            </div>
          </fieldset>

          <fieldset className="fs">
            <legend>Photos (from public/img)</legend>
            <div className="f">
              <Field label="Photo" error={e.img?.message}><select className="in" {...register("img")}>{imgOptions}</select></Field>
              <div className="fg g2">
                <Field label="Hover photo" error={e.alt?.message}><select className="in" {...register("alt")}>{imgOptions}</select></Field>
                <Field label="Photo position" hint="CSS, e.g. 50% 30%" error={e.pos?.message}><input className="in mono" {...register("pos")} /></Field>
              </div>
              <p className="hint" style={{ margin: 0 }}>No photo? Pick a room photo and the crop point of the product in it.</p>
              <div className="fg g2">
                <Field label="Room photo" error={e.cimg?.message}><select className="in" {...register("cimg")}>{imgOptions}</select></Field>
                <Field label="Crop position" hint="e.g. 26% 45%" error={e.crop?.message}><input className="in mono" {...register("crop")} /></Field>
              </div>
              <div className="inline" style={{ flexWrap: "wrap", gap: 8 }}>
                {/* eslint-disable @next/next/no-img-element -- admin previews of local files */}
                {img && <img className="thumb" style={{ width: 72, height: 72 }} src={img} alt="Photo" />}
                {alt && <img className="thumb" style={{ width: 72, height: 72 }} src={alt} alt="Hover photo" />}
                {!img && cimg && (
                  <span className="thumb" style={{ width: 72, height: 72, backgroundImage: `url(${cimg})`, backgroundSize: "400%", backgroundPosition: crop || "50% 50%" }} />
                )}
                {/* eslint-enable @next/next/no-img-element */}
              </div>
            </div>
          </fieldset>
        </div>
      </div>
      <div className="factions">
        <button className="b pri" type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : mode === "create" ? "Add product" : "Save changes"}</button>
        {mode === "edit" && isDirty && <span className="small muted">Unsaved changes</span>}
      </div>
    </form>
  );
}

/* ---------- quick stock change from the list ---------- */

const adjustForm = z.object({
  n: z.number({ error: "Enter a number" }).int("Whole numbers only").refine((n) => n !== 0, "Not 0"),
  unit: z.enum(["pcs", "ctn"]),
});
type AdjustForm = z.input<typeof adjustForm>;

export function StockAdjust({ id, carton }: { id: string; carton: number }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AdjustForm>({
    resolver: zodResolver(adjustForm),
    defaultValues: { unit: carton > 1 ? "ctn" : "pcs" },
  });
  const submit = handleSubmit(async (v) => {
    setMsg(null);
    const r = await adjustStock({ id, delta: v.n * (v.unit === "ctn" ? carton : 1) });
    setMsg(r.ok ? { ok: true, text: "✓" } : { ok: false, text: r.error });
    if (r.ok) reset({ unit: v.unit });
  });
  return (
    <form className="inline" onSubmit={submit} noValidate title="Use a minus sign to take stock out">
      <input className="in sm" style={{ width: 74 }} type="number" placeholder="±" aria-label={`Stock change for ${id}`} aria-invalid={!!errors.n} {...register("n", NUM)} />
      {carton > 1 && (
        <select className="in sm" aria-label="Unit" {...register("unit")}>
          <option value="ctn">ctn</option><option value="pcs">pcs</option>
        </select>
      )}
      <button className="b sm" type="submit" disabled={isSubmitting}>{isSubmitting ? "…" : "Apply"}</button>
      {(errors.n || msg) && <span className={msg?.ok ? "small" : "ferr"} style={msg?.ok ? { color: "var(--ok)" } : undefined}>{errors.n?.message ?? msg?.text}</span>}
    </form>
  );
}
