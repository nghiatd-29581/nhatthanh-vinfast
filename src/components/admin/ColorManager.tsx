"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { saveVehicleColors, type ColorRename } from "@/app/admin/_actions/colors";
import { isHex, swatchStyle } from "@/lib/colors";
import type { ColorOption, ColorType, VehicleImage } from "@/lib/types";

interface Row { key: string; orig: string | null; name: string; hex: string; hex2: string | null; type: ColorType }

const QUICK: Record<ColorType, { name: string; hex: string }[]> = {
  exterior: [
    { name: "Trắng", hex: "#F2F2F0" }, { name: "Đen", hex: "#151515" }, { name: "Xám", hex: "#6B6E73" }, { name: "Bạc", hex: "#C3C6CB" },
    { name: "Đỏ", hex: "#B3262E" }, { name: "Xanh dương", hex: "#1F4FA3" }, { name: "Xanh lá", hex: "#3E6B48" }, { name: "Vàng", hex: "#F2C230" },
  ],
  interior: [
    { name: "Đen", hex: "#1C1C1E" }, { name: "Be", hex: "#D8C8AE" }, { name: "Nâu", hex: "#6B4A33" }, { name: "Xám", hex: "#7A7D82" }, { name: "Trắng kem", hex: "#EFE9DE" },
  ],
};

let seq = 0;
const newKey = () => `k${++seq}-${Date.now()}`;

export function ColorManager({ vehicleId, colors, images }: { vehicleId: string; colors: ColorOption[]; images: Pick<VehicleImage, "color_name" | "image_type">[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() =>
    colors.map((c) => ({ key: newKey(), orig: c.name, name: c.name, hex: c.hex, hex2: c.hex2 ?? null, type: c.type ?? "exterior" })),
  );
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [pending, start] = useTransition();
  const [dirty, setDirty] = useState(false);

  const update = (key: string, patch: Partial<Row>) => { setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x))); setDirty(true); };
  const remove = (key: string) => { setRows((r) => r.filter((x) => x.key !== key)); setDirty(true); };
  const add = (type: ColorType, name = "", hex = "#cccccc") => {
    if (name && rows.some((r) => r.type === type && r.name.toLowerCase() === name.toLowerCase())) return;
    setRows((r) => [...r, { key: newKey(), orig: null, name, hex, hex2: null, type }]);
    setDirty(true);
  };
  const move = (key: string, dir: -1 | 1) => {
    setRows((r) => {
      const row = r.find((x) => x.key === key);
      if (!row) return r;
      const idxs = r.map((x, i) => (x.type === row.type ? i : -1)).filter((i) => i >= 0);
      const pos = idxs.indexOf(r.indexOf(row));
      const target = idxs[pos + dir];
      if (target === undefined) return r;
      const next = [...r];
      [next[r.indexOf(row)], next[target]] = [next[target], next[r.indexOf(row)]];
      return next;
    });
    setDirty(true);
  };
  const imgCount = (r: Row) =>
    images.filter((i) => i.color_name === (r.orig ?? r.name) && (r.type === "interior" ? i.image_type === "interior" : i.image_type !== "interior")).length;

  function save() {
    const bad = rows.find((r) => !r.name.trim());
    if (bad) return setMsg({ error: "Có màu chưa đặt tên." });
    const badHex = rows.find((r) => !isHex(r.hex) || (r.hex2 && !isHex(r.hex2)));
    if (badHex) return setMsg({ error: `Mã màu của “${badHex.name}” không hợp lệ (dạng #RRGGBB).` });
    const renames: ColorRename[] = rows.filter((r) => r.orig && r.orig !== r.name.trim()).map((r) => ({ from: r.orig!, to: r.name.trim(), type: r.type }));
    const payload: ColorOption[] = rows.map((r) => ({ name: r.name.trim(), hex: r.hex, hex2: r.hex2, type: r.type }));
    start(async () => {
      const res = await saveVehicleColors(vehicleId, payload, renames);
      if (res.ok) {
        setRows((r) => r.map((x) => ({ ...x, orig: x.name.trim(), name: x.name.trim() })));
        setDirty(false);
        setMsg({ ok: "Đã lưu bảng màu. Có thể gắn màu cho ảnh ở tab Hình ảnh." });
        router.refresh();
      } else setMsg({ error: res.error });
    });
  }

  const section = (type: ColorType, title: string, desc: string) => {
    const list = rows.filter((r) => r.type === type);
    return (
      <section className="rounded-2xl border border-silver bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-bold">{title} <span className="font-normal text-steel">({list.length})</span></h2>
            <p className="mt-0.5 text-sm text-steel">{desc}</p>
          </div>
          <button type="button" onClick={() => add(type)} className="btn btn-ghost btn-sm"><Plus className="size-4" /> Thêm màu</button>
        </div>

        {list.length ? (
          <ul className="mt-4 divide-y divide-silver">
            {list.map((r, i) => (
              <li key={r.key} className="grid items-center gap-3 py-3 md:grid-cols-[48px_1fr_auto_auto_auto]">
                <span className="size-12 rounded-full border border-black/10 shadow-inner" style={swatchStyle(r)} aria-hidden />
                <input value={r.name} onChange={(e) => update(r.key, { name: e.target.value })} className="field" placeholder="Tên màu, ví dụ: Trắng ngọc trai" aria-label="Tên màu" maxLength={60} />
                <div className="flex items-center gap-2">
                  <input type="color" value={isHex(r.hex) && r.hex.length === 7 ? r.hex : "#cccccc"} onChange={(e) => update(r.key, { hex: e.target.value })} className="h-11 w-12 cursor-pointer rounded-lg border border-silver bg-white p-1" aria-label="Chọn màu" />
                  <input value={r.hex} onChange={(e) => update(r.key, { hex: e.target.value.trim() })} className="field !w-28 font-mono text-sm" aria-label="Mã màu" />
                </div>
                <div className="flex items-center gap-2">
                  {r.hex2 ? (
                    <>
                      <input type="color" value={r.hex2.length === 7 ? r.hex2 : "#cccccc"} onChange={(e) => update(r.key, { hex2: e.target.value })} className="h-11 w-12 cursor-pointer rounded-lg border border-silver bg-white p-1" aria-label="Màu thứ hai" />
                      <button type="button" className="text-xs font-semibold text-steel hover:text-ink" onClick={() => update(r.key, { hex2: null })}>Bỏ màu 2</button>
                    </>
                  ) : (
                    <button type="button" className="text-xs font-semibold text-brand" onClick={() => update(r.key, { hex2: type === "exterior" ? "#151515" : "#D8C8AE" })}>
                      + {type === "exterior" ? "Phối màu nóc" : "Phối 2 tông"}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="mr-2 text-xs text-steel tabular-nums" title="Số ảnh đang gắn màu này">{imgCount(r)} ảnh</span>
                  <button type="button" onClick={() => move(r.key, -1)} disabled={i === 0} className="rounded p-1.5 text-steel hover:bg-mist disabled:opacity-30" aria-label="Lên"><ArrowUp className="size-4" /></button>
                  <button type="button" onClick={() => move(r.key, 1)} disabled={i === list.length - 1} className="rounded p-1.5 text-steel hover:bg-mist disabled:opacity-30" aria-label="Xuống"><ArrowDown className="size-4" /></button>
                  <button type="button" onClick={() => { if (!imgCount(r) || confirm(`Màu “${r.name}” đang gắn với ${imgCount(r)} ảnh. Xoá màu sẽ bỏ gắn màu khỏi các ảnh này (ảnh vẫn giữ). Tiếp tục?`)) remove(r.key); }}
                    className="rounded p-1.5 text-signal hover:bg-signal/10" aria-label={`Xoá màu ${r.name}`}><Trash2 className="size-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl bg-mist p-4 text-sm text-steel">Chưa có màu nào.</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-steel">Thêm nhanh:</span>
          {QUICK[type].map((q) => (
            <button key={q.name} type="button" onClick={() => add(type, q.name, q.hex)}
              className="inline-flex items-center gap-1.5 rounded-full border border-silver px-2.5 py-1 text-xs hover:border-ink">
              <span className="size-3.5 rounded-full border border-black/10" style={{ background: q.hex }} /> {q.name}
            </button>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="grid max-w-5xl gap-5">
      {msg.ok || msg.error ? (
        <p role="status" className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.error ? "bg-signal/10 text-signal" : "bg-emerald-600/10 text-emerald-800"}`}>
          {msg.error ?? msg.ok}{msg.ok ? <> <Link href={`/admin/vehicles/${vehicleId}?tab=images`} className="underline">Mở tab Hình ảnh</Link></> : null}
        </p>
      ) : null}
      {section("exterior", "Màu ngoại thất", "Hiện ở mục “Màu sắc” trên trang xe. Bấm vào màu, ảnh xe đổi sang ảnh của màu đó.")}
      {section("interior", "Màu nội thất", "Hiện ở mục “Nội thất”. Mỗi màu nội thất có thể có bộ ảnh riêng.")}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-silver bg-white/95 p-4 shadow-lg backdrop-blur">
        <p className="text-sm text-steel">
          Tên màu nên đặt theo tên gọi chính thức trong bảng màu của hãng. Đổi tên màu sẽ tự cập nhật các ảnh đang gắn tên cũ.
        </p>
        <button type="button" onClick={save} disabled={pending || !dirty} className="btn btn-primary btn-sm">
          {pending ? <Loader2 className="size-4 animate-spin" /> : null} {dirty ? "Lưu bảng màu" : "Đã lưu"}
        </button>
      </div>
    </div>
  );
}
