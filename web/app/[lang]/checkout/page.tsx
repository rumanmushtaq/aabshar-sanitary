import type { Metadata } from "next";
import { Suspense } from "react";
import { getT } from "@/lib/i18n";
import { hasLang } from "@/lib/i18n/config";
import { getDealer } from "@/lib/auth";
import { availableCredit } from "@/lib/orders";
import { Checkout, type CheckoutDealer } from "@/components/checkout/checkout";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  return { title: getT(lang)("Checkout"), robots: { index: false } };
}

/** Reads the dealer session cookie, so it renders at request time behind the Suspense boundary. */
async function CheckoutForSession() {
  const d = await getDealer();
  const dealer: CheckoutDealer | null = d
    ? { name: d.name, phone: d.phone, city: d.city, available: await availableCredit(d), terms: d.termsDays }
    : null;
  return <Checkout dealer={dealer} />;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="col gut co" />}>
      <CheckoutForSession />
    </Suspense>
  );
}
