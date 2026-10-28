"use client";
import Link from "next/link";
import { useState } from "react";
import { VehicleStage, type StageVehicle } from "./VehicleStage";
import type { VehicleImage } from "@/lib/types";

export function ShowcaseSwitcher({ items }: { items: { id: string; slug: string; stage: StageVehicle; images: VehicleImage[] }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const cur = items.find((i) => i.id === active) ?? items[0];
  if (!cur) return null;
  return (
    <div>
      <div className="flex flex-wrap gap-x-6 gap-y-2" role="group" aria-label="Chọn mẫu xe">
        {items.map((i) => (
          <button key={i.id} type="button" onClick={() => setActive(i.id)} aria-pressed={i.id === cur.id}
            className={`text-2xl font-extrabold tracking-[-0.03em] transition-colors md:text-4xl ${i.id === cur.id ? "text-white" : "text-white/25 hover:text-white/60"}`}>
            {i.stage.name.replace(/^VinFast\s+/i, "")}
          </button>
        ))}
      </div>
      <div className="mt-8">
        <VehicleStage key={cur.id} vehicle={cur.stage} images={cur.images} />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/xe/${cur.slug}`} className="btn btn-light">Xem chi tiết {cur.stage.name}</Link>
        <Link href={`/xe/${cur.slug}#bao-gia`} className="btn btn-ghost-dark">Nhận báo giá</Link>
      </div>
    </div>
  );
}
