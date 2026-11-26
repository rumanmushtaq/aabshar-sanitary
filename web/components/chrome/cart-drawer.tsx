"use client";

import { useRouter } from "next/navigation";
import { useCatalog, useI18n, useShop } from "@/components/providers";
import { FIN, FREE_OVER } from "@/lib/data";
import { productText } from "@/lib/i18n";
import { lineTotal } from "@/lib/pricing";
import { Pic } from "@/components/product/pic";
import { BagIcon, CloseIcon } from "@/components/icons";
import { NavLink } from "./nav-link";

/** Cart drawer (v7 renderCart). */
export function CartDrawer({ open, onClose, onLeave }: { open: boolean; onClose: () => void; onLeave: () => void }) {
  const { t, rs, href, lang } = useI18n();
  const { mode, cart, count, sum, setQty, removeLine, toast } = useShop();
  const { BY } = useCatalog();
  const router = useRouter();
  const dealer = mode === "dealer";
  const pct = Math.min(100, (sum / FREE_OVER) * 100);

  return (
    <aside className={"drawer" + (open ? " on" : "")} id="cartd" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <div className="dhead">
        <h2 id="cart-title">
          {t("Your cart")}{" "}
          <span className="mono" style={{ fontSize: ".9rem", color: "var(--muted)" }}>
            {count ? t(`· ${count} ${count === 1 ? "item" : "items"}`) : ""}
          </span>
        </h2>
        <button className="x" type="button" aria-label={t("Close cart")} onClick={onClose}><CloseIcon /></button>
      </div>

      <div className="dbody">
        {cart.length ? (
          cart.map((l, i) => {
            const p = BY[l.id];
            if (!p) return null;
            const name = productText(p, lang).name;
            const step = dealer ? p.carton : 1;
            const info = [p.id];
            if (l.fin) info.push(t(FIN[l.fin].label));
            if (dealer) info.push(t(p.carton > 1 ? `${l.qty / p.carton} ${p.pack === "bundle" ? "bdl" : "ctn"}` : `${l.qty} pcs`));
            return (
              <div className="line" key={l.id + l.fin}>
                <Pic p={p} alt={name} sizes="72px" />
                <div>
                  <b>{name}</b>
                  <small className="mono">{info.join(" · ")}</small>
                  <br />
                  <span className="step-q">
                    <button type="button" aria-label={t("Fewer")} onClick={() => setQty(i, l.qty - step)}>−</button>
                    <span>{l.qty}</span>
                    <button type="button" aria-label={t("More")} onClick={() => setQty(i, l.qty + step)}>+</button>
                  </span>
                </div>
                <div style={{ textAlign: "end", display: "grid", gap: 4, justifyItems: "end" }}>
                  <span className="mono">{rs(lineTotal(l, BY, mode))}</span>
                  <button className="rm" type="button" onClick={() => removeLine(i)}>{t("Remove")}</button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty">
            <BagIcon strokeWidth={1.5} />
            <b style={{ color: "var(--ink)", fontSize: "1.1rem" }}>{t("Your cart is empty")}</b>
            <span>{t("Start with our best sellers or build a full bathroom set.")}</span>
            <NavLink className="btn line" to="/#best" onClick={onLeave}>{t("Shop best sellers")}</NavLink>
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="dfoot">
          {dealer ? (
            <span className="note">{t("Dealer order · Tier B slab prices · on credit or bank transfer")}</span>
          ) : (
            <>
              <span className="note">
                {sum >= FREE_OVER ? t("Free delivery unlocked") : t(`${rs(FREE_OVER - sum)} more for free delivery in Gujranwala & Lahore`)}
              </span>
              <div className="free"><i style={{ width: pct + "%" }} /></div>
            </>
          )}
          <div className="sum"><span>{t("Subtotal")}</span><span className="mono">{rs(sum)}</span></div>
          <button
            className="btn dark full"
            type="button"
            onClick={() => {
              onLeave();
              router.push(href("/checkout"));
            }}
          >
            {t(dealer ? "Place order on credit" : "Checkout · Cash on Delivery")}
          </button>
          <button className="btn wa full" type="button" onClick={() => toast("Opens WhatsApp with your list and total")}>
            {t("Send this order on WhatsApp")}
          </button>
        </div>
      )}
    </aside>
  );
}
