import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ORDERS } from "@/lib/data";
import { getT } from "@/lib/i18n";
import { hasLang } from "@/lib/i18n/config";
import { OrderRow } from "@/components/dealer/order-row";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  return { title: getT(lang)("Orders"), robots: { index: false } };
}

export default async function DealerOrders({ params }: Props) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  return <div className="dcard">{ORDERS.map((o) => <OrderRow key={o.no} o={o} lang={lang} />)}</div>;
}
