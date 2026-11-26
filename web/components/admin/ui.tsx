"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/admin/schemas";

/* ---------- side navigation ---------- */

export function NavLinks({ items }: { items: ([string, string] | "sep")[] }) {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Admin">
      {items.map((it, i) => {
        if (it === "sep") return <div key={"s" + i} className="sep" />;
        const [href, label] = it;
        const on = href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/");
        return (
          <Link key={href} href={href} className={on ? "on" : undefined} aria-current={on ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ---------- one-click action (toggle, delete) ---------- */

export function ActionButton({ action, label, confirm, className = "b sm" }: { action: () => Promise<ActionResult>; label: string; confirm?: string; className?: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = () => {
    if (confirm && !window.confirm(confirm)) return;
    setError(null);
    start(async () => {
      const r = await action();
      if (!r.ok) setError(r.error);
    });
  };
  return (
    <span className="inline">
      <button type="button" className={className} onClick={run} disabled={pending}>{pending ? "…" : label}</button>
      {error && <span className="ferr" role="alert">{error}</span>}
    </span>
  );
}

/* ---------- list filters: updates the query string ---------- */

export type FilterField =
  | { name: string; label: string; type: "search"; placeholder?: string }
  | { name: string; label: string; type: "select"; options: [string, string][] };

const filterSchema = z.record(z.string(), z.string().max(100));

export function FilterBar({ fields, values }: { fields: FilterField[]; values: Record<string, string> }) {
  const router = useRouter();
  const path = usePathname();
  const { register, handleSubmit } = useForm<Record<string, string>>({ resolver: zodResolver(filterSchema), defaultValues: values });
  const go = handleSubmit((v) => {
    const qs = new URLSearchParams();
    for (const f of fields) {
      const val = (v[f.name] ?? "").trim();
      if (val) qs.set(f.name, val);
    }
    const s = qs.toString();
    router.push(s ? `${path}?${s}` : path);
  });
  return (
    <form className="filters" role="search" onSubmit={go}>
      {fields.map((f) =>
        f.type === "search" ? (
          <label key={f.name} className="grow" style={{ display: "contents" }}>
            <span className="sr">{f.label}</span>
            <input className="in grow" type="search" placeholder={f.placeholder ?? f.label} {...register(f.name)} />
          </label>
        ) : (
          <label key={f.name} style={{ display: "contents" }}>
            <span className="sr">{f.label}</span>
            <select className="in" {...register(f.name, { onChange: () => go() })}>
              {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        ),
      )}
      <button className="b" type="submit">Search</button>
    </form>
  );
}
