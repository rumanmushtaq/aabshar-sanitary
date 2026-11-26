import type { Metadata } from "next";
import { listCategories, listImages, requireStaff } from "@/lib/admin-data";
import { PageHead } from "@/components/admin/bits";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireStaff();
  const [cats, images] = await Promise.all([listCategories(), listImages()]);
  return (
    <>
      <PageHead crumb={["Products", "/admin/products"]} title="Add product" />
      <ProductForm mode="create" cats={cats} images={images} />
    </>
  );
}
