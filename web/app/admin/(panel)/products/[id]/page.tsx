import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductRow, listCategories, listImages, requireStaff } from "@/lib/admin-data";
import { PageHead } from "@/components/admin/bits";
import { ProductForm } from "@/components/admin/product-form";
import type { ProductInput } from "@/lib/actions/admin/schemas";
import { dayTime } from "@/components/admin/format";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  let id = (await params).id;
  try {
    id = decodeURIComponent(id);
  } catch {
    notFound();
  }
  id = id.slice(0, 20);
  const [p, cats, images] = await Promise.all([getProductRow(id), listCategories(), listImages()]);
  if (!p) notFound();
  const values: ProductInput = {
    id: p.id, name: p.name, nameUr: p.nameUr ?? "", cat: p.cat, sub: p.sub ?? "", subUr: p.subUr ?? "",
    price: p.price, was: p.was, carton: p.carton, slabs: [p.slabs[0] ?? p.price, p.slabs[1] ?? p.price, p.slabs[2] ?? p.price],
    flag: p.flag ?? "", sale: p.sale, fins: p.fins as ProductInput["fins"], specs: p.specs.join("\n"), specsUr: (p.specsUr ?? []).join("\n"),
    pt: (p.pt ?? "") as ProductInput["pt"], pack: (p.pack ?? "") as ProductInput["pack"], wty: p.wty ?? "", tags: p.tags ?? "",
    img: p.img ?? "", alt: p.alt ?? "", cimg: p.cimg ?? "", pos: p.pos ?? "", crop: p.crop ?? "",
    stock: p.stock, active: p.active, sort: p.sort,
  };
  return (
    <>
      <PageHead crumb={["Products", "/admin/products"]} title={p.name} sub={<><span className="mono">{p.id}</span> · last changed {dayTime(p.updatedAt)}</>}>
        <a className="b" href={`/en/p/${encodeURIComponent(p.id)}`} target="_blank" rel="noopener">View in shop</a>
      </PageHead>
      <ProductForm mode="edit" cats={cats} images={images} values={values} />
    </>
  );
}
