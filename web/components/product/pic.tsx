import Image from "next/image";
import type { Product } from "@/lib/data";

/**
 * A product's photo, or for products without one, a crop of the room photo it appears in.
 * Display size comes from the CSS of the parent (.card .pic, .line, .sres ...).
 */
export function Pic({ p, big = false, alt, sizes = "160px", className, style }: {
  p: Product;
  /** Card-size crop (zooms the room photo less). */
  big?: boolean;
  alt?: string;
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const label = alt ?? p.name;
  if (p.crop || !p.img) {
    return (
      <span
        className={["thumb", big ? "big" : "", className ?? ""].join(" ").trim()}
        role="img"
        aria-label={label}
        style={{
          backgroundImage: `url(${p.cimg ?? "/img/look.jpg"})`,
          backgroundPosition: p.crop,
          backgroundSize: big ? "420%" : "720%",
          ...style,
        }}
      />
    );
  }
  return (
    <Image
      src={p.img}
      alt={label}
      width={800}
      height={1000}
      sizes={sizes}
      className={className}
      style={{ objectPosition: p.pos, ...style }}
    />
  );
}
