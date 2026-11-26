import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n";
import { hasLang } from "@/lib/i18n/config";
import { QuickOrder } from "@/components/dealer/quick-order";

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ cat?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  return { title: getT(lang)("Quick order"), robots: { index: false } };
}

export default async function DealerQuickOrder({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  // ?cat= is only known per request, so the table streams in behind Suspense.
  return (
    <Suspense fallback={<div className="qtable" />}>
      <Table searchParams={searchParams} />
    </Suspense>
  );
}

async function Table({ searchParams }: Pick<Props, "searchParams">) {
  const { cat } = await searchParams;
  const c = typeof cat === "string" ? cat : "All";
  // key resets the table when the category link changes; QuickOrder falls back to "All" for an unknown category.
  return <QuickOrder key={c} initialCat={c} />;
}
