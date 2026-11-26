import type { Metadata } from "next";
import { requireStaff } from "@/lib/admin-data";
import { PageHead } from "@/components/admin/bits";
import { PasswordForm } from "@/components/admin/staff-forms";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const me = await requireStaff();
  return (
    <>
      <PageHead title="My account" sub={<>{me.name} · {me.email} · {me.role === "admin" ? "Admin" : "Staff"}</>} />
      <section className="card" style={{ maxWidth: 460 }}>
        <h2 className="h">Change password</h2>
        <PasswordForm />
      </section>
    </>
  );
}
