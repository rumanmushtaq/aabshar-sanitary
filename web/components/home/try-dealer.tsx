"use client";

import { useI18n, useShop } from "@/components/providers";
import { scrollToId } from "./use-home-hash";

/** Switches to dealer prices (demo) and scrolls to the price list. */
export function TryDealer() {
  const { t } = useI18n();
  const { setMode } = useShop();
  return (
    <button
      className="btn glass"
      type="button"
      data-show="retail"
      id="try-dealer"
      onClick={() => {
        setMode("dealer");
        scrollToId("best");
      }}
    >
      {t("Preview dealer prices")}
    </button>
  );
}
