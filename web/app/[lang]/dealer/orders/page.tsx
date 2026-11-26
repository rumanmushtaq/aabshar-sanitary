import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n";
import { hasLang, type Lang } from "@/lib/i18n/config";
import { getOrders } from "@/lib/dealer-data";
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
  return (
    <Suspense fallback={<div className="dcard" />}>
      <Orders lang={lang} />
    </Suspense>
  );
}

async function Orders({ lang }: { lang: Lang }) {
  const orders = await getOrders();
  if (!orders) return null; // signed out: the layout shows the sign-in gate
  return (
    <div className="dcard">
      {orders.length ? orders.map((o) => <OrderRow key={o.no} o={o} lang={lang} />) : <p className="note">{getT(lang)("No orders yet")}</p>}
    </div>
  );
}
