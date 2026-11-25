"use client";

import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BY, FIN, METAL, SET } from "@/lib/data";
import { useI18n, useShop } from "@/components/providers";

const schema = z.object({
  fin: z.enum(["chrome", "black", "gold", "gunmetal"]),
  on: z.array(z.boolean()),
});
type Values = z.infer<typeof schema>;

/** Dealer price in the set builder is a flat 22% off retail, as in the prototype. */
const DEALER_MULT = 0.78;

/** Bathroom set builder: one finish for every piece, 10% off when all pieces are picked. */
export function SetBuilder() {
  const { t, rs } = useI18n();
  const { mode, addItem, openOverlay } = useShop();
  const { control, register, setValue, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fin: "chrome", on: SET.map((s) => s.on) },
  });
  const fin = useWatch({ control, name: "fin" });
  const on = useWatch({ control, name: "on" });

  const dealer = mode === "dealer";
  const mult = FIN[fin].mult * (dealer ? DEALER_MULT : 1);
  const prices = SET.map((s) => BY[s.id].price * (s.qty ?? 1) * mult);
  const n = on.filter(Boolean).length;
  const sum = prices.reduce((a, pr, i) => a + (on[i] ? pr : 0), 0);
  const full = n === SET.length;
  const save = full ? sum * 0.1 : 0;
  const count = `${n} ${n === 1 ? "piece" : "pieces"} · ${FIN[fin].label}` + (dealer ? " · dealer price" : "");

  const onAdd = (v: Values) => {
    SET.forEach((s, i) => {
      if (!v.on[i]) return;
      const p = BY[s.id];
      addItem(s.id, p.fins.includes(v.fin) ? v.fin : p.fins[0], (dealer ? p.carton : 1) * (s.qty ?? 1), true);
    });
    openOverlay("cart");
  };

  return (
    <div className="builder">
      <div className="bview" id="bview" aria-label={t("Pieces in your set")}>
        {SET.map((s, i) => (
          <figure key={s.id} id={"bf-" + i} className={on[i] ? undefined : "off"}>
            <Image src={s.img} alt={t(s.name)} width={600} height={600} sizes="(max-width: 980px) 50vw, 25vw" />
            <figcaption>{s.id}</figcaption>
          </figure>
        ))}
      </div>
      <form className="bpanel" onSubmit={handleSubmit(onAdd)}>
        <div style={{ display: "grid", gap: 12 }}>
          <h3>{t("1 · Finish")}</h3>
          <div className="fpick" role="group" aria-label={t("Set finish")} id="fpick">
            {METAL.map((f) => (
              <button key={f} type="button" aria-pressed={f === fin} onClick={() => setValue("fin", f as Values["fin"])}>
                <span className={"sw " + f} />{t(FIN[f].label)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <h3>{t("2 · Pieces")}</h3>
          <div id="items">
            {SET.map((s, i) => (
              <label key={s.id} className="item" htmlFor={"it-" + i}>
                <input type="checkbox" id={"it-" + i} {...register(`on.${i}`)} />
                <span>{t(s.name + (s.qty ? " ×" + s.qty : ""))}<small className="mono">{s.id}</small></span>
                <span className="mono" id={"ip-" + i}>{rs(prices[i])}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="total">
          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "var(--muted)", fontSize: ".88rem" }} id="t-count">{t(count)}</span>
            <span className="mono big" id="t-sum">{rs(sum - save)}</span>
            <small id="t-save">{full ? t("Full set: you save " + rs(save)) : t("Add all 4 pieces to save 10%")}</small>
          </div>
          <button className="btn dark" type="submit" id="add-set" disabled={n === 0}>{t("Add set to cart")}</button>
        </div>
      </form>
    </div>
  );
}
