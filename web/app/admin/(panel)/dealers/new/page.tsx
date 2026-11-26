import type { Metadata } from "next";
import { requireStaff } from "@/lib/admin-data";
import { NoAccess, PageHead } from "@/components/admin/bits";
import { DealerForm } from "@/components/admin/dealer-form";

export const metadata: Metadata = { title: "Add dealer" };

export default async function NewDealerPage() {
  const me = await requireStaff();
  return (
    <>
      <PageHead crumb={["Dealers", "/admin/dealers"]} title="Add dealer" sub="The dealer signs in to the portal with this mobile number and PIN." />
      {me.role === "admin" ? <DealerForm mode="create" isAdmin /> : <NoAccess />}
    </>
  );
}
