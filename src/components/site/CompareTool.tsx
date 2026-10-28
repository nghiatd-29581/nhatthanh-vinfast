"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatVnd, orDash, publicPrice } from "@/lib/format";
import type { Variant, Vehicle } from "@/lib/types";

const MAX = 3;

export function CompareTool({ vehicles, variants, initial }: { vehicles: Vehicle[]; variants: Variant[]; initial: string[] }) {
  const [selected, setSelected] = useState<string[]>(
    initial.map((s) => vehicles.find((v) => v.slug === s)?.id).filter((x): x is string => Boolean(x)).slice(0, MAX),
  );
  const chosen = selected.map((id) => vehicles.find((v) => v.id === id)!).filter(Boolean);

  const rows = useMemo(() => {
    const vOf = (id: string) => variants.filter((x) => x.vehicle_id === id);
    return [
      { label: "Giá bán", get: (v: Vehicle) => publicPrice(v).label },
      { label: "Phiên bản", get: (v: Vehicle) => (vOf(v.id).length ? vOf(v.id).map((x) => x.name).join(", ") : "Chưa cập nhật") },
      { label: "Số chỗ ngồi", get: (v: Vehicle) => orDash(v.seats, " chỗ") },
      { label: "Kích thước", get: (v: Vehicle) => orDash(v.dimensions) },
      { label: "Quãng đường/lần sạc", get: (v: Vehicle) => (v.range_km ? `${v.range_km.toLocaleString("vi-VN")} km${v.range_standard ? ` (${v.range_standard})` : ""}` : "Chưa cập nhật") },
      { label: "Công suất", get: (v: Vehicle) => orDash(v.power_text) },
      { label: "Trang bị nổi bật", get: (v: Vehicle) => (v.highlights?.length ? v.highlights.slice(0, 4).map((h) => h.title).join(" • ") : "Chưa cập nhật") },
      { label: "Chính sách bảo hành", get: (v: Vehicle) => orDash(v.warranty_text) },
      { label: "Chi phí lăn bánh ước tính", get: (v: Vehicle) => (v.price_verified && v.rolling_price_estimate ? formatVnd(v.rolling_price_estimate) : "Chưa cập nhật") },
    ];
  }, [variants]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= MAX ? s : [...s, id]));

  return (
    <div>
      <fieldset>
        <legend className="text-sm font-semibold text-steel">Chọn tối đa {MAX} mẫu xe ({selected.length}/{MAX})</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {vehicles.map((v) => {
            const on = selected.includes(v.id);
            const disabled = !on && selected.length >= MAX;
            return (
              <button key={v.id} type="button" onClick={() => toggle(v.id)} disabled={disabled} aria-pressed={on}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${on ? "border-ink bg-ink text-white" : "border-silver bg-white hover:border-ink"} disabled:cursor-not-allowed disabled:opacity-40`}>
                {v.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      {chosen.length < 2 ? (
        <div className="mt-10 rounded-[var(--radius-card)] bg-mist p-10 text-center">
          <p className="text-lg font-semibold">Chọn ít nhất 2 mẫu xe để bắt đầu so sánh.</p>
        </div>
      ) : (
        <div className="mt-10 overflow-x-auto rounded-[var(--radius-card)] border border-silver">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="w-44 bg-mist p-4 align-bottom text-steel" scope="col">Hạng mục</th>
                {chosen.map((v) => (
                  <th key={v.id} scope="col" className="p-4 align-bottom">
                    <div className="relative mb-3 aspect-[16/9] overflow-hidden rounded-xl bg-mist">
                      <SafeImage src={v.cover_image} alt={v.name} fill sizes="300px" className="object-contain p-2" />
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/xe/${v.slug}`} className="text-base font-bold hover:text-brand">{v.name}</Link>
                      <button type="button" onClick={() => toggle(v.id)} aria-label={`Bỏ ${v.name}`} className="rounded-full p-1 text-steel hover:bg-mist"><X className="size-4" /></button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-silver">
                  <th scope="row" className="bg-mist p-4 font-semibold text-steel">{r.label}</th>
                  {chosen.map((v) => {
                    const val = r.get(v);
                    return <td key={v.id} className={`p-4 ${val === "Chưa cập nhật" ? "text-steel" : "font-medium"}`}>{val}</td>;
                  })}
                </tr>
              ))}
              <tr className="border-t border-silver">
                <th scope="row" className="bg-mist p-4" />
                {chosen.map((v) => (
                  <td key={v.id} className="p-4"><Link href={`/xe/${v.slug}#bao-gia`} className="btn btn-primary btn-sm">Nhận báo giá</Link></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs text-steel">Chỉ hiển thị dữ liệu đã được xác minh. Thông tin thiếu được ghi “Chưa cập nhật”.</p>
    </div>
  );
}
