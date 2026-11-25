import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Fraunces, JetBrains_Mono, Manrope, Noto_Nastaliq_Urdu } from "next/font/google";
import { LANGS, LOCALES, hasLang } from "@/lib/i18n/config";
import { getT } from "@/lib/i18n";
import { Providers } from "@/components/providers";
import { Footer, Header, Overlays } from "@/components/chrome";
import "../globals.css";

const fraunces = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--font-fraunces" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: ["500"], variable: "--font-nastaliq", preload: false });

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  const t = getT(lang);
  return {
    title: { default: t("Aabshar Sanitary"), template: "%s · " + t("Aabshar Sanitary") },
    description: t("Sanitary fittings made in Gujranwala, Pakistan. Sold to homes and through 320+ dealers."),
    icons: { icon: "/img/logo-mark.svg" },
    alternates: { languages: { en: "/en", ur: "/ur" } },
  };
}

export const viewport: Viewport = { themeColor: "#0d1117", viewportFit: "cover" };

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  return (
    <html lang={lang} dir={LANGS[lang].dir} className={[fraunces.variable, manrope.variable, jetbrains.variable, nastaliq.variable].join(" ")}>
      <body className="retail">
        <Providers lang={lang}>
          <Header />
          <main id="top">{children}</main>
          <Footer />
          <Overlays />
        </Providers>
      </body>
    </html>
  );
}
