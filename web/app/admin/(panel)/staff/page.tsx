import type { Metadata } from "next";
import { listUsers, requireStaff } from "@/lib/admin-data";
import { NoAccess, PageHead } from "@/components/admin/bits";
import { ActionButton } from "@/components/admin/ui";
import { AddUserForm } from "@/components/admin/staff-forms";
import { setUserActive } from "@/lib/actions/admin/staff";
import { day } from "@/components/admin/format";

export const metadata: Metadata = { title: "Staff users" };

export default async function StaffPage() {
  const me = await requireStaff();
  if (me.role !== "admin") return (<><PageHead title="Staff users" /><NoAccess /></>);
  const users = await listUsers();
  return (
    <>
      <PageHead title="Staff users" sub="Admins can also change settings, promo codes, credit limits and staff. Staff handle orders, products, stock and dealer payments." />
      <div className="cols">
        <section className="card flush">
          <div className="tw">
            <table className="t">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Added</th><th></th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={u.active ? undefined : "off"}>
                    <td style={{ fontWeight: 600 }}>{u.name}{u.id === me.id && <span className="small muted"> (you)</span>}</td>
                    <td>{u.email}</td>
                    <td><span className={"bd plain " + (u.role === "admin" ? "brass" : "")}>{u.role === "admin" ? "Admin" : "Staff"}</span></td>
                    <td className="small nowrap">{day(u.createdAt)}</td>
                    <td className="num">
                      {u.id !== me.id && (
                        <ActionButton
                          action={setUserActive.bind(null, u.id, !u.active)}
                          label={u.active ? "Deactivate" : "Reactivate"}
                          className={"b sm" + (u.active ? " danger" : "")}
                          confirm={u.active ? `Deactivate ${u.name}? They are signed out at once.` : undefined}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card">
          <h2 className="h">Add a user</h2>
          <AddUserForm />
        </section>
      </div>
    </>
  );
}
