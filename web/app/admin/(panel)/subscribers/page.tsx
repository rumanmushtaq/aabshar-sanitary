import type { Metadata } from "next";
import { listSubscribers, requireStaff } from "@/lib/admin-data";
import { PageHead, Pager, one } from "@/components/admin/bits";
import { dayTime, num } from "@/components/admin/format";

export const metadata: Metadata = { title: "Subscribers" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SubscribersPage({ searchParams }: Props) {
  await requireStaff();
  const page = Math.max(1, parseInt(one((await searchParams).page), 10) || 1);
  const res = await listSubscribers(page);
  return (
    <>
      <PageHead title="Subscribers" sub={`${num(res.total)} newsletter sign-ups`}>
        <a className="b pri" href="/api/admin/subscribers.csv" download>Download CSV</a>
      </PageHead>
      <div className="card flush">
        <div className="tw">
          <table className="t">
            <thead><tr><th>Email</th><th>Language</th><th>Signed up</th></tr></thead>
            <tbody>
              {res.rows.map((s) => (
                <tr key={s.id}><td>{s.email}</td><td>{s.lang === "ur" ? "Urdu" : "English"}</td><td className="small nowrap">{dayTime(s.createdAt)}</td></tr>
              ))}
              {!res.rows.length && <tr><td colSpan={3} className="empty">No subscribers yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pager page={res.page} pages={res.pages} total={res.total} base="/admin/subscribers" params={{}} />
      </div>
    </>
  );
}
