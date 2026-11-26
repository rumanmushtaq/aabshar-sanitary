// Small presentational pieces shared by server and client admin components (no hooks, no server imports).
import Link from "next/link";
import { STATUS_LABEL } from "./format";

export function Field({ label, hint, error, children, className }: { label: React.ReactNode; hint?: React.ReactNode; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={"fld" + (className ? " " + className : "")}>
      <span>{label}</span>
      {children}
      {error ? <span className="ferr">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </label>
  );
}

export function Msg({ ok, text }: { ok: boolean; text?: string | null }) {
  if (!text) return null;
  return <div className={"msg " + (ok ? "ok" : "bad")} role={ok ? "status" : "alert"}>{text}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={"bd " + status}>{STATUS_LABEL[status] ?? status}</span>;
}

export function PageHead({ title, sub, crumb, children }: { title: React.ReactNode; sub?: React.ReactNode; crumb?: [string, string]; children?: React.ReactNode }) {
  return (
    <div className="ph">
      <div>
        {crumb && <div className="crumb"><Link href={crumb[1]}>← {crumb[0]}</Link></div>}
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {children && <div className="acts">{children}</div>}
    </div>
  );
}

/** Prev / next links that keep the other query values. */
export function Pager({ page, pages, total, base, params }: { page: number; pages: number; total: number; base: string; params: Record<string, string | undefined> }) {
  const at = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") qs.set(k, v);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `${base}?${s}` : base;
  };
  return (
    <div className="pager">
      <span>{total.toLocaleString("en-PK")} in total · page {page} of {pages}</span>
      <span className="pg">
        {page > 1 ? <Link className="b sm" href={at(page - 1)}>← Prev</Link> : <span className="b sm" aria-disabled="true" style={{ opacity: 0.4 }}>← Prev</span>}
        {page < pages ? <Link className="b sm" href={at(page + 1)}>Next →</Link> : <span className="b sm" aria-disabled="true" style={{ opacity: 0.4 }}>Next →</span>}
      </span>
    </div>
  );
}

export function NoAccess() {
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h1 style={{ fontFamily: "var(--f-display)", fontWeight: 400, margin: "0 0 6px" }}>Admins only</h1>
      <p className="muted" style={{ margin: 0 }}>This screen is for admin accounts. Ask an admin if you need a change here.</p>
    </div>
  );
}

/** First value of a search param. */
export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
