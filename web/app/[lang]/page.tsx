import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLang } from "@/lib/i18n/config";
import { getT } from "@/lib/i18n";
import { Hero } from "@/components/home/hero";
import { Best, Factory, Plastic, Sets, ShopMosaic, Story, Usp, Ways } from "@/components/home/sections";
import { ShopTheLook } from "@/components/home/shop-the-look";
import { DealerFinder } from "@/components/home/dealer-finder";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  const t = getT(lang);
  return { title: { absolute: t("Aabshar Sanitary") + " · " + t("Factory direct from Gujranwala") } };
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  return (
    <div className="view" id="v-home">
      <Hero />
      <Usp lang={lang} />
      <ShopMosaic lang={lang} />
      <Best lang={lang} />
      <Plastic lang={lang} />
      <Story lang={lang} />
      <Ways lang={lang} />
      <Sets lang={lang} />
      <Factory lang={lang} />
      <ShopTheLook />
      <DealerFinder />
    </div>
  );
}
