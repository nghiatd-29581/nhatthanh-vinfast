import Link from "next/link";

export function SectionHead({ title, lede, action, dark = false, id }: { title: string; lede?: string; action?: { href: string; label: string }; dark?: boolean; id?: string }) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 id={id} className="h-section">{title}</h2>
        {lede ? <p className={`lede mt-4 ${dark ? "!text-white/60" : ""}`}>{lede}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className={`btn shrink-0 ${dark ? "btn-ghost-dark" : "btn-ghost"}`}>{action.label}</Link>
      ) : null}
    </div>
  );
}
