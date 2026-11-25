import type { Metadata } from "next";
import { getT } from "@/lib/i18n";
import { hasLang } from "@/lib/i18n/config";
import { Checkout } from "@/components/checkout/checkout";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  return { title: getT(lang)("Checkout"), robots: { index: false } };
}

export default function CheckoutPage() {
  return <Checkout />;
}
