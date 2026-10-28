import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { BADGE_LABELS, SALES_STATUS_LABELS } from "@/lib/constants";
import { orDash, publicPrice } from "@/lib/format";
import type { Vehicle } from "@/lib/types";

export function VehicleCard({ v, priority = false }: { v: Vehicle; priority?: boolean }) {
  const price = publicPrice(v);
  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-silver bg-white">
      <Link href={`/xe/${v.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-gradient-to-b from-mist to-silver/70" tabIndex={-1} aria-hidden>
        <SafeImage
          src={v.cover_image}
          alt={`${v.name} — ảnh đại diện`}
          fill
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          className="object-contain p-4 transition-transform duration-700 [transition-timing-function:var(--ease-drive)] group-hover:scale-[1.04]"
          priority={priority}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {v.badges.map((b) => (
            <span key={b} className={`chip ${b === "promo" ? "bg-signal text-white" : b === "new" ? "bg-brand text-white" : "bg-ink text-white"}`}>
              {BADGE_LABELS[b] ?? b}
            </span>
          ))}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold tracking-[-0.02em]">
              <Link href={`/xe/${v.slug}`} className="hover:text-brand">{v.name}</Link>
            </h3>
            <p className="mt-0.5 text-sm text-steel">{v.category?.name ?? "Phân khúc đang cập nhật"}</p>
          </div>
          <span className="chip shrink-0 bg-mist text-steel">{SALES_STATUS_LABELS[v.sales_status]}</span>
        </div>
        <p className={`mt-4 text-lg font-bold ${price.value ? "text-ink" : "text-brand"}`}>{price.label}</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 border-t border-silver pt-3 text-sm">
          <div>
            <dt className="text-steel">Số chỗ</dt>
            <dd className="font-semibold">{orDash(v.seats, " chỗ")}</dd>
          </div>
          <div>
            <dt className="text-steel">Quãng đường/lần sạc</dt>
            <dd className="font-semibold">{v.range_km ? `${v.range_km.toLocaleString("vi-VN")} km${v.range_standard ? ` (${v.range_standard})` : ""}` : "Chưa cập nhật"}</dd>
          </div>
        </dl>
        <div className="mt-5 flex gap-2 pt-1">
          <Link href={`/xe/${v.slug}`} className="btn btn-ghost btn-sm flex-1">Khám phá xe</Link>
          <Link href={`/xe/${v.slug}#bao-gia`} className="btn btn-primary btn-sm flex-1">Nhận báo giá</Link>
        </div>
      </div>
    </article>
  );
}
