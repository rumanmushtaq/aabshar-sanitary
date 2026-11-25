import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLang } from "@/lib/i18n/config";
import { getT, href } from "@/lib/i18n";
import { ShopListing, ShopView } from "@/components/product/shop-listing";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  const t = getT(lang);
  return {
    title: t("All products"),
    description: t("Taps · Showers · Tanks · Pipes · Made in Gujranwala"),
    alternates: { languages: { en: href("/shop", "en"), ur: href("/shop", "ur") } },
  };
}

export default async function ShopPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  const t = getT(lang);
  return (
    <div className="col gut pv shop">
      <nav className="crumbs" aria-label={t("Breadcrumb")}>
        <Link href={href("/", lang)}>{t("Home")}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t("All products")}</span>
      </nav>
      {/* The prerendered shell shows every product; the category from ?cat= applies in the browser. */}
      <Suspense fallback={<ShopView />}>
        <ShopListing />
      </Suspense>
    </div>
  );
}
