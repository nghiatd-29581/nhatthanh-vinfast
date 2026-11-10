"use client";
import { useMemo, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import type { ColorOption, Highlight, SpecGroups, VehicleImage } from "@/lib/types";
import { swatchStyle } from "@/lib/colors";

type Tab = "exterior" | "interior" | "color" | "tech" | "specs";
const TABS: { key: Tab; label: string }[] = [
  { key: "exterior", label: "Ngoại thất" },
  { key: "interior", label: "Nội thất" },
  { key: "color", label: "Màu sắc" },
  { key: "tech", label: "Công nghệ" },
  { key: "specs", label: "Thông số" },
];

export interface StageVehicle {
  name: string;
  cover_image: string | null;
  colors: ColorOption[];
  highlights: Highlight[];
  specifications: SpecGroups;
  quickSpecs: { label: string; value: string }[];
}

/** Khu trưng bày xe: tab ngoại/nội thất, chọn màu đổi ảnh tương ứng, công nghệ, thông số */
export function VehicleStage({ vehicle, images, dark = true }: { vehicle: StageVehicle; images: VehicleImage[]; dark?: boolean }) {
  const [tab, setTab] = useState<Tab>("exterior");
  const extColors = useMemo(() => vehicle.colors.filter((c) => c.type !== "interior"), [vehicle.colors]);
  const intColors = useMemo(() => vehicle.colors.filter((c) => c.type === "interior"), [vehicle.colors]);
  const [color, setColor] = useState<string | null>(extColors[0]?.name ?? null);
  const [intColor, setIntColor] = useState<string | null>(intColors[0]?.name ?? null);
  const [index, setIndex] = useState(0);

  const pool = useMemo(() => {
    if (tab === "interior") {
      const all = images.filter((i) => i.image_type === "interior");
      // Nếu ảnh nội thất đã được gắn màu → lọc theo màu nội thất đang chọn; chưa gắn thì hiện tất cả
      const tagged = all.some((i) => i.color_name && intColors.some((c) => c.name === i.color_name));
      return tagged && intColor ? all.filter((i) => i.color_name === intColor || !i.color_name) : all;
    }
    if (tab === "color") {
      return images.filter((i) => color && i.color_name === color && i.image_type !== "interior");
    }
    const ext = images.filter((i) => i.image_type === "exterior" || i.image_type === "detail");
    return ext.length ? ext : vehicle.cover_image ? [{ image_url: vehicle.cover_image, alt_text: vehicle.name } as VehicleImage] : [];
  }, [tab, images, color, intColor, intColors, vehicle.cover_image, vehicle.name]);

  const current = pool[Math.min(index, Math.max(0, pool.length - 1))];
  const muted = dark ? "text-white/60" : "text-steel";
  const showsImage = tab === "exterior" || tab === "interior" || tab === "color";

  return (
    <div>
      <div className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5 md:mx-0 md:px-0" role="tablist" aria-label={`Khám phá ${vehicle.name}`}>
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => { setTab(t.key); setIndex(0); }}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              tab === t.key ? (dark ? "border-white text-white" : "border-ink text-ink") : `border-transparent ${muted} hover:opacity-100`
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6" role="tabpanel">
        {showsImage && (
          <>
            <div className={`relative aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] ${dark ? "bg-[radial-gradient(ellipse_at_50%_80%,#2a2e37_0%,#101114_65%)]" : "bg-mist"}`}>
              {current ? (
                <SafeImage key={current.image_url} src={current.image_url} alt={current.alt_text || vehicle.name} fill sizes="(min-width:1024px) 70vw, 100vw" className="object-contain" dark={dark} />
              ) : (
                <SafeImage src={null} alt="" dark={dark} placeholderLabel={tab === "interior" ? "Chưa có ảnh nội thất" : tab === "color" ? "Chưa có ảnh cho màu này" : undefined} />
              )}
            </div>
            {pool.length > 1 && (
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                {pool.map((img, i) => (
                  <button key={img.id ?? img.image_url} type="button" onClick={() => setIndex(i)} aria-label={`Ảnh ${i + 1}`} aria-current={i === index}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${i === index ? "border-brand" : "border-transparent opacity-70"}`}>
                    <SafeImage src={img.image_url} alt="" fill sizes="96px" className="object-cover" dark={dark} placeholderLabel=" " />
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "color" && (
          <div className="mt-5">
            {extColors.length ? (
              <Swatches colors={extColors} value={color} onChange={(n) => { setColor(n); setIndex(0); }} dark={dark} label="Màu ngoại thất" />
            ) : (
              <p className={muted}>Bảng màu đang được cập nhật.</p>
            )}
          </div>
        )}

        {tab === "interior" && intColors.length ? (
          <div className="mt-5">
            <Swatches colors={intColors} value={intColor} onChange={(n) => { setIntColor(n); setIndex(0); }} dark={dark} label="Màu nội thất" />
          </div>
        ) : null}

        {tab === "tech" && (
          vehicle.highlights.length ? (
            <ul className="grid gap-px overflow-hidden rounded-[var(--radius-card)] sm:grid-cols-2">
              {vehicle.highlights.map((h) => (
                <li key={h.title} className={`p-6 ${dark ? "bg-ink-2" : "bg-mist"}`}>
                  <p className="text-lg font-bold">{h.title}</p>
                  <p className={`mt-1.5 ${muted}`}>{h.text}</p>
                </li>
              ))}
            </ul>
          ) : <p className={muted}>Thông tin công nghệ đang được cập nhật.</p>
        )}

        {tab === "specs" && (
          <dl className="grid gap-px overflow-hidden rounded-[var(--radius-card)] sm:grid-cols-2">
            {vehicle.quickSpecs.map((s) => (
              <div key={s.label} className={`flex justify-between gap-4 p-5 ${dark ? "bg-ink-2" : "bg-mist"}`}>
                <dt className={muted}>{s.label}</dt>
                <dd className="text-right font-semibold">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}

function Swatches({ colors, value, onChange, dark, label }: { colors: ColorOption[]; value: string | null; onChange: (name: string) => void; dark: boolean; label: string }) {
  return (
    <div role="radiogroup" aria-label={label}>
      <p className={`mb-3 text-sm ${dark ? "text-white/60" : "text-steel"}`}>
        {label}: <span className={dark ? "font-semibold text-white" : "font-semibold text-ink"}>{value ?? "—"}</span>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {colors.map((c) => (
          <button key={c.name} type="button" role="radio" aria-checked={value === c.name} onClick={() => onChange(c.name)} title={c.name}
            className={`rounded-full p-1 ring-2 transition ${value === c.name ? (dark ? "ring-white" : "ring-ink") : "ring-transparent hover:ring-white/30"}`}>
            <span className="block size-9 rounded-full border border-black/10 shadow-inner" style={swatchStyle(c)} />
            <span className="sr-only">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
