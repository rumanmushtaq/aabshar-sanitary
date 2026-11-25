// Homepage sections without interaction of their own (server components).
import Image from "next/image";
import Link from "next/link";
import type { Lang } from "@/lib/i18n/config";
import { getT, href as hrefFor } from "@/lib/i18n";
import { BEST } from "@/lib/data";
import { ProductCard } from "@/components/product/product-card";
import { catSlug } from "@/components/product/catalog";
import { ArrowIcon, CardIcon, ChatIcon, LockIcon, ShieldIcon, TickIcon, TruckIcon } from "./icons";
import { QuickOrder } from "./quick-order";
import { TankFinder } from "./tank-finder";
import { PlasticRange } from "./plastic-range";
import { TryDealer } from "./try-dealer";
import { SetBuilder } from "./set-builder";

type L = { lang: Lang };

export function Usp({ lang }: L) {
  const t = getT(lang);
  const items = [
    [<CardIcon key="i" />, "Cash on Delivery", "Pay when it arrives"],
    [<ShieldIcon key="i" />, "10-year warranty", "Registered online"],
    [<TruckIcon key="i" />, "2–5 day delivery", "Cost shown by city"],
    [<ChatIcon key="i" />, "Order on WhatsApp", "Send a photo or SKU"],
  ] as const;
  return (
    <div className="usp gut">
      <div className="col">
        {items.map(([icon, b, s]) => (
          <div key={b}>{icon}<span><b>{t(b)}</b><span>{t(s)}</span></span></div>
        ))}
      </div>
    </div>
  );
}

/** Category tiles. Fitting categories open the shop filtered to that category. */
const TILES: { cls?: string; img: string; w: number; h: number; pos?: string; n: string; name: string; plastic?: boolean }[] = [
  { cls: "t-a", img: "/img/vanity-brass.jpg", w: 1400, h: 933, n: "01 · 48 DESIGNS", name: "Taps & Mixers" },
  { cls: "t-b", img: "/img/rain-walnut.jpg", w: 1000, h: 1500, n: "02 · 22 DESIGNS", name: "Showers" },
  { img: "/img/hand-gold.jpg", w: 1000, h: 667, pos: "70% 50%", n: "03", name: "Muslim Showers" },
  { img: "/img/wc.jpg", w: 1000, h: 750, n: "04", name: "Commodes" },
  { img: "/img/basin.jpg", w: 1000, h: 681, n: "05", name: "Basins" },
  { img: "/img/kitchen.jpg", w: 1000, h: 667, n: "06", name: "Kitchen" },
  { cls: "t-e", img: "/img/valves.jpg", w: 1000, h: 563, n: "07 · FOR PLUMBERS", name: "Valves & Fittings" },
  { cls: "t-p", img: "/img/plastic-tanks.jpg", w: 1800, h: 1355, pos: "50% 38%", n: "08 · NEW · PLASTIC WORKS", name: "Water tanks, pipes & household plastic", plastic: true },
];

export function ShopMosaic({ lang }: L) {
  const t = getT(lang);
  const href = (p: string) => hrefFor(p, lang);
  return (
    <section className="band gut" id="shop">
      <div className="col">
        <div className="head rise">
          <div>
            <span className="eyebrow">{t("The collection")}</span>
            <h2 className="display h2" style={{ marginTop: 14 }}>
              {t("Everything behind")}<br />{t("the bathroom door")}
            </h2>
          </div>
          <Link className="link" href={href("/shop")}>{t("View all products")}</Link>
        </div>
        <div className="mosaic">
          {TILES.map((x) => {
            const body = (
              <>
                <Image src={x.img} alt="" width={x.w} height={x.h} sizes={x.cls ? "(max-width: 760px) 100vw, 50vw" : "(max-width: 760px) 50vw, 25vw"} style={x.pos ? { objectPosition: x.pos } : undefined} />
                <span className="go"><ArrowIcon /></span>
                <span className="n">{/[A-Za-z]/.test(x.n) ? t(x.n) : x.n}</span>
                <h3>{t(x.name)}</h3>
              </>
            );
            const cls = "rise tile" + (x.cls ? " " + x.cls : "");
            return x.plastic ? (
              <a key={x.name} className={cls} href="#plastic">{body}</a>
            ) : (
              <Link key={x.name} className={cls} href={href("/shop?cat=" + catSlug(x.name))}>{body}</Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Best({ lang }: L) {
  const t = getT(lang);
  return (
    <section className="band gut" id="best" style={{ paddingTop: 0 }}>
      <div className="col">
        <div className="head rise">
          <div>
            <span className="eyebrow" data-show="retail">{t("Best sellers")}</span>
            <span className="eyebrow" data-show="dealer">{t("Dealer price list · Tier B")}</span>
            <h2 className="display h2" style={{ marginTop: 14 }} data-show="retail">{t("Most ordered this month")}</h2>
            <h2 className="display h2" style={{ marginTop: 14 }} data-show="dealer">{t("Your carton prices")}</h2>
            <p data-show="retail">{t("Prices include delivery in Gujranwala and Lahore. Other cities at checkout.")}</p>
            <p data-show="dealer">{t("Price per piece falls as cartons go up. Order on credit or by bank transfer.")}</p>
          </div>
          <Link className="link" href={hrefFor("/shop", lang)}>{t("See all 120 products")}</Link>
        </div>
        <QuickOrder />
        <div className="rail" id="rail">
          {BEST.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  );
}

export function Plastic({ lang }: L) {
  const t = getT(lang);
  const stats = [
    ["3 layers", "Food-grade inside", "White inner layer keeps water clean and stops moss."],
    ["UV+", "Made for rooftop sun", "Stabilised outer layer does not crack in a 48°C summer."],
    ["PN10", "Pressure-rated pipes", "Every pipe batch tested before it leaves Gujranwala."],
  ];
  return (
    <section className="band gut plas" id="plastic">
      <div className="col">
        <div className="head rise">
          <div>
            <span className="eyebrow">{t("Aabshar Plastic Works · Gujranwala")}</span>
            <h2 className="display h2" style={{ marginTop: 14 }}>
              {t("Plastic, built like")} <em>{t("our brass.")}</em>
            </h2>
            <p>{t("Water tanks, pipes and household plastic from our second unit. Same warranty card, same carton prices for shops.")}</p>
          </div>
          <a className="link" href="#tankf">{t("Find your tank size")}</a>
        </div>
        <div className="phero">
          <figure className="ph rise">
            <Image className="drift" src="/img/plastic-tanks.jpg" alt={t("Three green plastic water tanks on a steel stand and a concrete base")} width={1800} height={1355} sizes="(max-width: 980px) 100vw, 60vw" />
            <figcaption><span className="mono">AP-T500</span> {t("Triple-layer tank, 500 gallons")}</figcaption>
          </figure>
          <TankFinder />
        </div>
        <div className="pstats">
          {stats.map(([m, b, p]) => (
            <div key={m} className="rise"><span className="mono">{t(m)}</span><b>{t(b)}</b><p>{t(p)}</p></div>
          ))}
        </div>
        <PlasticRange />
      </div>
    </section>
  );
}

export function Story({ lang }: L) {
  const t = getT(lang);
  const feats = [
    ["0.5 bar", "Works on low pressure", "Cartridges open fully on the pressure most roof tanks give."],
    ["8 layers", "Plating that keeps its shine", "Nickel under chrome or colour, so hard water and salt do not eat the finish."],
    ["½″ BSP", "Fits every standard pipe", "No adapters. Your plumber fits it with the tools he already has."],
  ];
  return (
    <section className="band gut" style={{ background: "var(--white)" }}>
      <div className="col story">
        <div className="ph">
          <Image className="drift" src="/img/spa.jpg" alt={t("Bright bathroom with a freestanding bath and wall-mounted taps")} width={1400} height={1508} sizes="(max-width: 980px) 100vw, 50vw" />
          <div className="inset">
            <Image src="/img/tap-brass.jpg" alt={t("Close-up of a brass cross-handle tap")} width={1000} height={667} sizes="(max-width: 980px) 42vw, 21vw" />
          </div>
        </div>
        <div>
          <span className="eyebrow" style={{ color: "var(--brass-text)" }}>{t("Built for Pakistani water")}</span>
          <h2 className="display h2" style={{ marginTop: 14 }}>{t("Made for roof tanks, hard water and summer heat")}</h2>
          <div className="feats">
            {feats.map(([m, b, p]) => (
              <div key={m} className="feat"><span className="mono">{t(m)}</span><div><b>{t(b)}</b><p>{t(p)}</p></div></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Ways({ lang }: L) {
  const t = getT(lang);
  const ticks = ["Cash on Delivery, JazzCash, Easypaisa or bank", "Free plumber video for every product", "7-day returns, unused and in the box"];
  return (
    <section className="band gut" id="ways">
      <div className="col">
        <div className="head rise">
          <div>
            <span className="eyebrow">{t("Two ways to buy")}</span>
            <h2 className="display h2" style={{ marginTop: 14 }}>{t("For homes. For shops.")}</h2>
          </div>
        </div>
        <div className="ways">
          <div className="way">
            <Image className="drift" src="/img/bath.jpg" alt="" width={1400} height={933} sizes="(max-width: 980px) 100vw, 50vw" />
            <span className="eyebrow">{t("For your home")}</span>
            <h3>{t("One tap or a full bathroom, at factory price")}</h3>
            <ul className="ticks">
              {ticks.map((x) => <li key={x}><TickIcon />{t(x)}</li>)}
            </ul>
            <div className="ctas" style={{ marginTop: 8 }}><a className="btn brass" href="#sets">{t("Build a bathroom set")}</a></div>
          </div>
          <div className="way">
            <Image className="drift" src="/img/fittings.jpg" alt="" width={1200} height={1800} sizes="(max-width: 980px) 100vw, 50vw" />
            <span className="eyebrow">{t("For sanitary shop owners")}</span>
            <h3>{t("Buy by the carton. Pay on credit.")}</h3>
            <p>{t("Approved dealers get slab prices, one-click reorders and a live khata with us.")}</p>
            <div className="locked">
              <div className="r h"><span>AB-1204</span><span>{t("1–4 ctn")}</span><span>{t("5–19 ctn")}</span><span>{t("20+ ctn")}</span></div>
              <div className="r"><span style={{ color: "var(--on-ink-2)" }}>{t("Per piece")}</span><span className="v">6,900</span><span className="v">6,600</span><span className="v">6,400</span></div>
              <span className="lock"><LockIcon />{t("Prices unlock after approval")}</span>
            </div>
            <div className="ctas" style={{ marginTop: 8 }}>
              <a className="btn brass" href="#ways" data-show="retail">{t("Apply as a dealer")}</a>
              <TryDealer />
              <Link className="btn brass" href={hrefFor("/dealer/order", lang)} data-show="dealer">{t("Open dealer price list")}</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Factory({ lang }: L) {
  const t = getT(lang);
  const gal = [
    ["/img/lathe.jpg", 1200, 821, "Lathe machines on the factory floor", "MACHINING"],
    ["/img/sparks.jpg", 1200, 675, "Sparks from metal work", "FINISHING"],
    ["/img/shavings.jpg", 1000, 634, "Brass shavings beside a machine", "BRASS"],
  ] as const;
  const steps = [
    ["01", "Brass casting", "Lead-free brass bodies, never zinc alloy, so they do not crack."],
    ["02", "CNC machining", "Threads cut to ½″ BSP for standard Pakistani plumbing."],
    ["03", "Layered plating", "Nickel, then chrome or PVD colour, polished by hand."],
    ["04", "Pressure test", "Each piece tested at [test bar], boxed with a warranty card."],
  ];
  return (
    <section className="band gut factory" id="factory">
      <div className="col">
        <div className="head rise">
          <div>
            <span className="eyebrow">{t("Our factory")}</span>
            <h2 className="display h2" style={{ marginTop: 14, color: "#fff" }}>{t("Four steps before a tap leaves us")}</h2>
          </div>
          <p>{t("Every design is cast, machined, plated and tested under one roof in Gujranwala.")}</p>
        </div>
        <div className="fgal">
          {gal.map(([src, w, h, alt, cap]) => (
            <figure key={src}>
              <Image src={src} alt={t(alt)} width={w} height={h} sizes="(max-width: 760px) 100vw, 33vw" />
              <figcaption>{t(cap)}</figcaption>
            </figure>
          ))}
        </div>
        <div className="steps">
          {steps.map(([n, h, p]) => (
            <div key={n} className="step rise"><span className="n">{n}</span><h3>{t(h)}</h3><p>{t(p)}</p></div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Sets({ lang }: L) {
  const t = getT(lang);
  return (
    <section className="band gut" id="sets" style={{ paddingTop: 0 }}>
      <div className="col">
        <div className="head rise">
          <div>
            <span className="eyebrow">{t("Bathroom set builder")}</span>
            <h2 className="display h2" style={{ marginTop: 14 }}>{t("One finish, every fitting")}</h2>
            <p>{t("Choose a finish and the pieces you need. Buy all four and save 10%.")}</p>
          </div>
        </div>
        <SetBuilder />
      </div>
    </section>
  );
}
