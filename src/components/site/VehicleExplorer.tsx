"use client";
import { useMemo, useState } from "react";
import type { Category, Vehicle } from "@/lib/types";
import { SALES_STATUS_LABELS } from "@/lib/constants";
import type { ReactNode } from "react";

const PRICE_RANGES = [
  { key: "all", label: "Mọi mức giá", min: 0, max: Infinity },
  { key: "u500", label: "Dưới 500 triệu", min: 0, max: 5e8 },
  { key: "500-1000", label: "500 triệu – 1 tỷ", min: 5e8, max: 1e9 },
  { key: "o1000", label: "Trên 1 tỷ", min: 1e9, max: Infinity },
];

/** Bộ lọc client-side; thẻ xe được render sẵn ở server và truyền vào qua renderCard map */
export function VehicleExplorer({ vehicles, categories, cards }: { vehicles: Vehicle[]; categories: Category[]; cards: Record<string, ReactNode> }) {
  const [cat, setCat] = useState("all");
  const [price, setPrice] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const range = PRICE_RANGES.find((r) => r.key === price)!;
    return vehicles.filter((v) => {
      if (cat !== "all" && v.category_id !== cat) return false;
      if (status !== "all" && v.sales_status !== status) return false;
      if (q && !v.name.toLowerCase().includes(q.trim().toLowerCase())) return false;
      if (price !== "all") {
        const p = v.price_verified ? v.starting_price : null;
        if (p == null || p < range.min || p >= range.max) return false;
      }
      return true;
    });
  }, [vehicles, cat, price, status, q]);

  const pill = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active ? "bg-ink text-white" : "bg-mist text-ink hover:bg-silver"}`;

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0" role="group" aria-label="Lọc theo phân khúc">
          <button type="button" className={pill(cat === "all")} onClick={() => setCat("all")} aria-pressed={cat === "all"}>Tất cả</button>
          {categories.map((c) => (
            <button type="button" key={c.id} className={pill(cat === c.id)} onClick={() => setCat(c.id)} aria-pressed={cat === c.id}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input className="field" placeholder="Tìm dòng xe" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tìm dòng xe" />
          <select className="field" value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Khoảng giá">
            {PRICE_RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <select className="field" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Trạng thái kinh doanh">
            <option value="all">Mọi trạng thái</option>
            {Object.entries(SALES_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
      </div>
      {price !== "all" && <p className="mt-3 text-sm text-steel">Lọc theo giá chỉ áp dụng cho xe đã có giá được xác minh.</p>}

      <p className="sr-only" aria-live="polite">{list.length} mẫu xe</p>
      {list.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => <div key={v.id}>{cards[v.id]}</div>)}
        </div>
      ) : (
        <div className="mt-8 rounded-[var(--radius-card)] bg-mist p-10 text-center">
          <p className="text-lg font-semibold">Chưa có mẫu xe phù hợp bộ lọc.</p>
          <p className="mt-1 text-steel">Thử bỏ bớt điều kiện, hoặc gọi hotline để được gợi ý mẫu xe phù hợp.</p>
        </div>
      )}
    </div>
  );
}
