"use client";
import { useState } from "react";
import { formatVnd } from "@/lib/format";
import { swatchStyle } from "@/lib/colors";
import { SALES_STATUS_LABELS } from "@/lib/constants";
import type { SpecGroups, Variant } from "@/lib/types";

function SpecTable({ specs }: { specs: SpecGroups }) {
  const groups = Object.entries(specs ?? {}).filter(([, rows]) => rows && Object.keys(rows).length);
  if (!groups.length) return <p className="text-steel">Bảng thông số chi tiết đang được cập nhật.</p>;
  return (
    <div className="grid gap-8">
      {groups.map(([group, rows]) => (
        <div key={group}>
          <h4 className="text-sm font-semibold text-steel">{group}</h4>
          <dl className="mt-2 divide-y divide-silver border-y border-silver">
            {Object.entries(rows).map(([k, val]) => (
              <div key={k} className="flex justify-between gap-6 py-3 text-sm">
                <dt className="text-steel">{k}</dt>
                <dd className="text-right font-semibold">{val || "Chưa cập nhật"}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

/** Chọn phiên bản → cập nhật giá, trang bị và thông số riêng của phiên bản (không gộp với phiên bản khác) */
export function VariantPanel({ variants, vehicleSpecs }: { variants: Variant[]; vehicleSpecs: SpecGroups }) {
  const [id, setId] = useState(variants[0]?.id);
  const v = variants.find((x) => x.id === id);

  if (!variants.length) {
    return (
      <div>
        <h3 className="text-2xl font-bold tracking-[-0.02em]">Thông số kỹ thuật</h3>
        <div className="mt-6"><SpecTable specs={vehicleSpecs} /></div>
      </div>
    );
  }
  const hasOwnSpecs = v && Object.keys(v.specifications ?? {}).length > 0;
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Phiên bản">
        {variants.map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === id} onClick={() => setId(x.id)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold ${x.id === id ? "bg-ink text-white" : "bg-mist hover:bg-silver"}`}>
            {x.name}
          </button>
        ))}
      </div>
      {v && (
        <div className="mt-8 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]" role="tabpanel">
          <div>
            <p className="text-sm text-steel">Giá phiên bản {v.name}</p>
            <p className="mt-1 text-3xl font-extrabold tracking-[-0.03em] tabular-nums">{v.price_verified && v.price ? formatVnd(v.price) : "Liên hệ để nhận báo giá"}</p>
            <p className="mt-2 text-sm text-steel">Trạng thái: {SALES_STATUS_LABELS[v.sales_status]}</p>
            {v.features?.length ? (
              <>
                <h3 className="mt-8 text-lg font-bold">Trang bị</h3>
                <ul className="mt-3 space-y-2">
                  {v.features.map((f) => <li key={f} className="flex gap-3 text-sm"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />{f}</li>)}
                </ul>
              </>
            ) : null}
            {v.colors?.length ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {v.colors.map((c) => <span key={c.name} title={c.name} className="size-7 rounded-full border border-black/10" style={swatchStyle(c)} />)}
              </div>
            ) : null}
          </div>
          <div>
            <h3 className="text-lg font-bold">Thông số kỹ thuật {hasOwnSpecs ? `— ${v.name}` : "chung"}</h3>
            <div className="mt-4"><SpecTable specs={hasOwnSpecs ? v.specifications : vehicleSpecs} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
