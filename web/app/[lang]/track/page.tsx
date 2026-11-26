import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getT, href } from "@/lib/i18n";
import { hasLang } from "@/lib/i18n/config";
import { TrackFromUrl, TrackOrder } from "@/components/checkout/track";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  return {
    title: getT(lang)("Track order"),
    robots: { index: false },
    alternates: { languages: { en: href("/track", "en"), ur: href("/track", "ur") } },
  };
}

export default async function TrackPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  // The prerendered shell has an empty form; ?no= fills the order number in the browser.
  return (
    <Suspense fallback={<TrackOrder />}>
      <TrackFromUrl />
    </Suspense>
  );
}
