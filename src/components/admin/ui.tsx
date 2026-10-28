import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em]">{title}</h1>
        {desc ? <p className="mt-1 text-sm text-steel">{desc}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <p role={error ? "alert" : "status"} className={`mb-5 rounded-xl px-4 py-3 text-sm font-medium ${error ? "bg-signal/10 text-signal" : "bg-emerald-600/10 text-emerald-800"}`}>
      {error ?? ok}
    </p>
  );
}

export function Card({ title, children, actions, className = "" }: { title?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-silver bg-white p-5 ${className}`}>
      {title || actions ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h2 className="font-bold">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({ label, value, href, tone = "default" }: { label: string; value: number | string; href?: string; tone?: "default" | "brand" | "warn" }) {
  const inner = (
    <div className={`rounded-2xl border p-5 ${tone === "brand" ? "border-brand bg-brand text-white" : tone === "warn" ? "border-amber-300 bg-amber-50" : "border-silver bg-white"}`}>
      <p className={`text-sm ${tone === "brand" ? "text-white/80" : "text-steel"}`}>{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-[-0.03em] tabular-nums">{value}</p>
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-steel">{hint}</span> : null}
    </label>
  );
}

export function Pill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "green" | "amber" | "red" | "blue" }) {
  const map = {
    default: "bg-mist text-ink",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    blue: "bg-brand/10 text-brand",
  };
  return <span className={`chip ${map[tone]}`}>{children}</span>;
}

export function Pagination({ page, total, perPage, base }: { page: number; total: number; perPage: number; base: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Phân trang">
      <span className="text-steel">Trang {page}/{pages} • {total} bản ghi</span>
      <div className="flex gap-2">
        {page > 1 ? <Link className="btn btn-ghost btn-sm" href={base(page - 1)}>Trang trước</Link> : null}
        {page < pages ? <Link className="btn btn-ghost btn-sm" href={base(page + 1)}>Trang sau</Link> : null}
      </div>
    </nav>
  );
}
