import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY, CATALOG, FIN, LOOKS } from "@/lib/data";
import { hasLang } from "@/lib/i18n/config";
import { getT, href, rs } from "@/lib/i18n";
import { finWord, lookPrice, packOf } from "@/lib/pricing";
import { ProductCard } from "@/components/product/product-card";
import { ProductView } from "@/components/product/product-view";
import { looksWith, related } from "@/components/product/catalog";
import { CashIcon, CheckIcon, PlayIcon, ReturnIcon, ShieldIcon } from "@/components/product/product-icons";

type Props = { params: Promise<{ lang: string; sku: string }> };

// The [lang] layout supplies each language; this adds every product under it.
export function generateStaticParams() {
  return CATALOG.map((p) => ({ sku: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, sku } = await params;
  const p = BY[sku];
  if (!hasLang(lang) || !p) return {};
  const t = getT(lang);
  const description = [t(p.cat), ...(p.sub ? [t(p.sub)] : []), ...p.specs.map(t)].join(" · ");
  return {
    title: t(p.name),
    description,
    alternates: { languages: { en: href("/p/" + p.id, "en"), ur: href("/p/" + p.id, "ur") } },
    openGraph: { title: t(p.name), description, images: p.img ? [p.img] : p.cimg ? [p.cimg] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { lang, sku } = await params;
  const p = BY[sku];
  if (!hasLang(lang) || !p) notFound();
  const t = getT(lang);
  const word = finWord(p);
  const wty = p.wty ?? "10-year warranty";
  const looks = looksWith(p);

  const specRows: [string, string][] = [
    [t("SKU"), p.id],
    [t("Category"), t(p.cat)],
    ...(p.fins.length ? [[t(word === "colour" ? "Colours" : "Finishes"), t(p.fins.map((f) => FIN[f].label).join(", "))] as [string, string]] : []),
    [t(p.carton > 1 ? "Pack" : "Sold as"), t(p.carton > 1 ? `${p.carton} pcs per ${packOf(p)}` : "Single piece")],
    [t("Warranty"), t(wty)],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: t(p.name),
    sku: p.id,
    category: t(p.cat),
    description: [p.sub, ...p.specs].filter(Boolean).map((s) => t(s as string)).join(" · "),
    image: [p.img, p.alt].filter(Boolean),
    brand: { "@type": "Brand", name: t("Aabshar") },
    offers: {
      "@type": "Offer",
      url: href("/p/" + p.id, lang),
      priceCurrency: "PKR",
      price: p.price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <div className="col gut pv">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav className="crumbs" aria-label={t("Breadcrumb")}>
        <Link href={href("/", lang)}>{t("Home")}</Link>
        <span aria-hidden="true">/</span>
        <Link href={href(p.id.startsWith("AP-") ? "/#plastic" : "/#shop", lang)}>{t(p.cat)}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t(p.name)}</span>
      </nav>

      <ProductView key={p.id} id={p.id}>
        <ul className="perks">
          <li><ShieldIcon /><span>{t(wty)}</span></li>
          <li><ReturnIcon /><span>{t("7-day returns, unused and in the box")}</span></li>
          <li><CashIcon /><span>{t("Cash on Delivery, JazzCash, Easypaisa or bank")}</span></li>
          <li><PlayIcon /><span>{t("Free plumber video for every product")}</span></li>
        </ul>
        <div className="acc">
          <details open>
            <summary>{t("Specifications")}</summary>
            <table className="spec">
              <tbody>
                {specRows.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}
              </tbody>
            </table>
            <ul className="ticks small">
              {p.specs.map((s) => <li key={s}><CheckIcon /><span>{t(s)}</span></li>)}
            </ul>
          </details>
          <details>
            <summary>{t("In the box")}</summary>
            <ul className="ticks small">
              <li><CheckIcon /><span>{t(p.name)}</span></li>
              <li><CheckIcon /><span>{t("Fixing kit and seals")}</span></li>
              <li><CheckIcon /><span>{t("Warranty card with QR code")}</span></li>
            </ul>
          </details>
          <details>
            <summary>{t("Installation")}</summary>
            <p>{t("Any plumber can fit it with standard tools. Scan the QR code on the box for a step-by-step video in Urdu.")}</p>
          </details>
          <details>
            <summary>{t("Warranty and returns")}</summary>
            <p>{t("Register your warranty online with the code on the card. Return unused items in the box within 7 days for a full refund.")}</p>
          </details>
        </div>
      </ProductView>

      {looks.length > 0 && (
        <section className="psec">
          <div className="head">
            <div>
              <span className="eyebrow" style={{ color: "var(--brass-text)" }}>{t("Shop the look")}</span>
              <h2 className="display h3">{t("Seen in these rooms")}</h2>
            </div>
          </div>
          <div className="prooms">
            {looks.map((i) => {
              const L = LOOKS[i];
              const sum = (m: "retail" | "dealer") => L.items.reduce((a, it) => a + lookPrice(it[0], it[3], m), 0);
              return (
                <Link key={i} href={href(`/#look-${i}`, lang)} className="proom">
                  <Image src={L.img} alt="" width={1600} height={1000} sizes="(max-width: 860px) 100vw, 33vw" style={{ objectPosition: L.pos }} />
                  <span>
                    <b>{t(L.name)}</b>
                    <small>
                      <span>{t(`${L.items.length} fittings`)}</span> ·{" "}
                      <span className="mono" data-show="retail">{rs(sum("retail"), lang)}</span>
                      <span className="mono" data-show="dealer">{rs(sum("dealer"), lang)}</span>
                    </small>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="psec">
        <div className="head">
          <div>
            <span className="eyebrow" style={{ color: "var(--brass-text)" }}>{t("Complete the set")}</span>
            <h2 className="display h3">{t("Goes well with")}</h2>
          </div>
        </div>
        <div className="rail">
          {related(p).map((x) => <ProductCard key={x.id} p={x} />)}
        </div>
      </section>
    </div>
  );
}
