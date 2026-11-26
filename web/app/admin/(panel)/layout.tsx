import { Suspense } from "react";
import Link from "next/link";
import { requireStaff } from "@/lib/admin-data";
import { adminLogout } from "@/lib/actions/admin/auth";
import { NavLinks } from "@/components/admin/ui";

/** Sidebar shell for every signed-in admin screen. Each page still checks the session itself. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await requireStaff();
  const admin = me.role === "admin";
  const items: ([string, string] | "sep")[] = [
    ["/admin", "Dashboard"],
    ["/admin/orders", "Orders"],
    ["/admin/products", "Products"],
    ["/admin/dealers", "Dealers"],
    ["/admin/subscribers", "Subscribers"],
    "sep",
    ...(admin ? ([["/admin/settings", "Settings"], ["/admin/staff", "Staff users"]] as [string, string][]) : []),
    ["/admin/account", "My account"],
  ];
  return (
    <div className="shell">
      <aside className="side">
        <Link href="/admin" className="brand"><b>Aabshar</b><span>Admin</span></Link>
        <NavLinks items={items} />
        <div className="who">
          <b>{me.name}</b>
          <span className="small">{admin ? "Admin" : "Staff"}</span>
          <div className="row">
            <a href="/en" target="_blank" rel="noopener">View shop</a>
            <form action={adminLogout}><button type="submit">Sign out</button></form>
          </div>
        </div>
      </aside>
      <main className="main">
        <Suspense fallback={<p className="muted">Loading…</p>}>{children}</Suspense>
      </main>
    </div>
  );
}
