import type { Metadata } from "next";
import { getT } from "@/lib/i18n";
import { hasLang } from "@/lib/i18n/config";
import { QuickOrder } from "@/components/dealer/quick-order";
import { dealerCats } from "@/components/dealer/data";

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ cat?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  return { title: getT(lang)("Quick order"), robots: { index: false } };
}

export default async function DealerQuickOrder({ searchParams }: Props) {
  const { cat } = await searchParams;
  const c = typeof cat === "string" && dealerCats().includes(cat) ? cat : "All";
  // key resets the table when the category link changes.
  return <QuickOrder key={c} initialCat={c} />;
}
