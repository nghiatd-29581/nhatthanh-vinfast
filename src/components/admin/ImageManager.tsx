"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { GripVertical, Loader2, Star, Trash2, Upload } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { addImages, checkImageUrls, deleteImage, reorderImages, setCoverImage, updateImage } from "@/app/admin/_actions/images";
import { IMAGE_TYPE_LABELS } from "@/lib/constants";
import { swatchStyle } from "@/lib/colors";
import type { ColorOption, VehicleImage } from "@/lib/types";

/** Màu phù hợp với loại ảnh: ảnh nội thất ↔ màu nội thất, còn lại ↔ màu ngoại thất */
const colorsFor = (colors: ColorOption[], imageType: string) =>
  colors.filter((c) => (imageType === "interior" ? c.type === "interior" : c.type !== "interior"));

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function ImageManager({ vehicleId, images, variants, colors }: { vehicleId: string; images: VehicleImage[]; variants: { id: string; name: string }[]; colors: ColorOption[] }) {
  const router = useRouter();
  const [list, setList] = useState(images);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [busy, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const [rights, setRights] = useState("");
  const [type, setType] = useState("exterior");
  const [addColor, setAddColor] = useState("");
  const addColors = colorsFor(colors, type);
  const dragId = useRef<string | null>(null);

  // đồng bộ khi server trả dữ liệu mới (sau router.refresh)
  useEffect(() => setList(images), [images]);

  const refresh = (ok?: string, error?: string) => {
    setMsg({ ok, error });
    router.refresh();
  };

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const valid = Array.from(files).filter((f) => ACCEPT.includes(f.type) && f.size <= MAX_BYTES);
    if (valid.length < files.length) setMsg({ error: "Một số tệp bị bỏ qua: chỉ nhận JPG, PNG, WebP, AVIF tối đa 8MB." });
    if (!valid.length) return;
    setUploading(true);
    const sb = createBrowserSupabase();
    const uploaded: { image_url: string; storage_path: string; alt_text: string }[] = [];
    for (const f of valid) {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${vehicleId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from("vehicle-images").upload(path, f, { cacheControl: "31536000", contentType: f.type, upsert: false });
      if (error) continue;
      const { data } = sb.storage.from("vehicle-images").getPublicUrl(path);
      uploaded.push({ image_url: data.publicUrl, storage_path: path, alt_text: f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") });
    }
    if (uploaded.length) {
      const res = await addImages(vehicleId, uploaded.map((u) => ({ ...u, image_type: type, color_name: addColor || null, usage_rights_note: rights || "Ảnh do quản trị viên tải lên" })));
      refresh(res.ok ? `Đã tải lên ${uploaded.length} ảnh` : undefined, res.error);
    } else {
      setMsg({ error: "Không tải lên được ảnh. Kiểm tra quyền Storage và thử lại." });
    }
    setUploading(false);
  }

  function onAddUrls(form: HTMLFormElement) {
    const fd = new FormData(form);
    const urls = String(fd.get("urls") ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
    if (!urls.length) return;
    startTransition(async () => {
      const res = await addImages(vehicleId, urls.map((u) => ({ image_url: u, image_type: type, color_name: addColor || null, alt_text: String(fd.get("alt") ?? ""), usage_rights_note: rights || null, source_url: u })));
      if (res.ok) form.reset();
      refresh(res.ok ? `Đã thêm ${urls.length} ảnh từ URL` : undefined, res.error);
    });
  }

  function onDrop(targetId: string) {
    const from = dragId.current;
    if (!from || from === targetId) return;
    const next = [...list];
    const a = next.findIndex((x) => x.id === from);
    const b = next.findIndex((x) => x.id === targetId);
    const [moved] = next.splice(a, 1);
    next.splice(b, 0, moved);
    setList(next);
    startTransition(async () => {
      const res = await reorderImages(vehicleId, next.map((x) => x.id));
      refresh(res.ok ? "Đã lưu thứ tự ảnh" : undefined, res.ok ? undefined : "Không lưu được thứ tự");
    });
  }

  return (
    <div className="grid gap-5">
      {msg.ok || msg.error ? <p role="status" className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.error ? "bg-signal/10 text-signal" : "bg-emerald-600/10 text-emerald-800"}`}>{msg.error ?? msg.ok}</p> : null}

      <section className="grid gap-5 rounded-2xl border border-silver bg-white p-5 lg:grid-cols-2">
        <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
          <label className="block"><span className="label">Loại ảnh khi thêm</span>
            <select value={type} onChange={(e) => { setType(e.target.value); setAddColor(""); }} className="field">
              {Object.entries(IMAGE_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label className="block"><span className="label">{type === "interior" ? "Màu nội thất khi thêm" : "Màu xe khi thêm"}</span>
            <select value={addColor} onChange={(e) => setAddColor(e.target.value)} className="field">
              <option value="">Không gắn màu</option>
              {addColors.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            {!addColors.length ? (
              <span className="mt-1 block text-xs text-steel">
                Xe chưa có màu {type === "interior" ? "nội thất" : "ngoại thất"}. <Link href={`/admin/vehicles/${vehicleId}?tab=colors`} className="font-semibold text-brand underline">Thêm ở tab Màu sắc</Link>
              </span>
            ) : null}
          </label>
          <label className="block"><span className="label">Ghi chú quyền sử dụng</span>
            <input value={rights} onChange={(e) => setRights(e.target.value)} className="field" placeholder="VD: Ảnh tự chụp / được VinFast cho phép dùng" />
          </label>
        </div>
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-silver p-6 text-center hover:border-brand">
          {uploading ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6 text-steel" />}
          <span className="font-semibold">{uploading ? "Đang tải lên…" : "Chọn nhiều ảnh để tải lên"}</span>
          <span className="text-xs text-steel">JPG, PNG, WebP, AVIF — tối đa 8MB mỗi ảnh. Lưu trong Supabase Storage.</span>
          <input type="file" multiple accept={ACCEPT.join(",")} className="sr-only" onChange={(e) => onFiles(e.target.files)} disabled={uploading} />
        </label>
        <form onSubmit={(e) => { e.preventDefault(); onAddUrls(e.currentTarget); }} className="grid gap-3">
          <label className="block"><span className="label">Thêm ảnh từ URL (mỗi dòng một URL https)</span>
            <textarea name="urls" rows={3} className="field font-mono text-xs" placeholder="https://..." />
          </label>
          <input name="alt" className="field" placeholder="Mô tả ảnh (alt text)" />
          <p className="text-xs text-steel">Chỉ dùng URL bạn được phép sử dụng. Host ảnh cần được khai báo trong NEXT_PUBLIC_IMAGE_HOSTS để được tối ưu.</p>
          <div><button className="btn btn-primary btn-sm" disabled={busy}>Thêm ảnh</button></div>
        </form>
      </section>

      <section className="rounded-2xl border border-silver bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">Thư viện ảnh ({list.length})</h2>
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy || !list.length}
            onClick={() => startTransition(async () => {
              const r = await checkImageUrls(list.map((i) => i.image_url));
              setBroken(Object.fromEntries(Object.entries(r).map(([k, ok]) => [k, !ok])));
              const n = Object.values(r).filter((ok) => !ok).length;
              setMsg(n ? { error: `${n} ảnh không truy cập được` } : { ok: "Tất cả URL ảnh hoạt động" });
            })}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null} Kiểm tra URL ảnh lỗi
          </button>
        </div>
        {!list.length ? <p className="text-sm text-steel">Chưa có ảnh. Website sẽ hiển thị ảnh giữ chỗ có nhãn “Ảnh minh họa”.</p> : (
          <ul className="grid gap-3">
            {list.map((img) => (
              <li key={img.id} draggable onDragStart={() => (dragId.current = img.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(img.id)}
                className={`grid gap-3 rounded-xl border p-3 md:grid-cols-[24px_140px_1fr_auto] ${broken[img.image_url] ? "border-signal bg-signal/5" : "border-silver"} ${img.is_active ? "" : "opacity-60"}`}>
                <GripVertical className="hidden size-5 cursor-grab self-center text-steel md:block" aria-label="Kéo để sắp xếp" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image_url} alt={img.alt_text} className="aspect-video w-full rounded-lg bg-mist object-cover md:w-[140px]" loading="lazy" referrerPolicy="no-referrer"
                  onError={() => setBroken((b) => ({ ...b, [img.image_url]: true }))} />
                <ImageFields img={img} variants={variants} colors={colors} onSaved={(ok) => refresh(ok ? "Đã lưu ảnh" : undefined, ok ? undefined : "Không lưu được ảnh")} />
                <div className="flex flex-row gap-2 md:flex-col">
                  <button type="button" disabled={img.is_cover} onClick={() => startTransition(async () => { const r = await setCoverImage(vehicleId, img.id); refresh(r.ok ? "Đã đặt ảnh đại diện" : undefined); })}
                    className={`btn btn-sm ${img.is_cover ? "btn-primary" : "btn-ghost"}`}><Star className="size-4" /> {img.is_cover ? "Ảnh đại diện" : "Đặt đại diện"}</button>
                  <button type="button" onClick={() => { if (confirm("Xoá ảnh này?")) startTransition(async () => { const r = await deleteImage(vehicleId, img.id); refresh(r.ok ? "Đã xoá ảnh" : undefined); }); }}
                    className="btn btn-ghost btn-sm text-signal"><Trash2 className="size-4" /> Xoá</button>
                  {broken[img.image_url] ? <span className="text-xs font-semibold text-signal">URL lỗi</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ImageFields({ img, variants, colors, onSaved }: { img: VehicleImage; variants: { id: string; name: string }[]; colors: ColorOption[]; onSaved: (ok: boolean) => void }) {
  const [pending, start] = useTransition();
  const [imgType, setImgType] = useState<string>(img.image_type);
  const [colorName, setColorName] = useState(img.color_name ?? "");
  const options = colorsFor(colors, imgType);
  const legacy = colorName && !options.some((c) => c.name === colorName);
  const current = options.find((c) => c.name === colorName);
  return (
    <form className="grid gap-2 text-sm sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await updateImage(img.id, {
            alt_text: String(fd.get("alt_text") ?? ""),
            image_type: String(fd.get("image_type")),
            color_name: String(fd.get("color_name") ?? ""),
            variant_id: String(fd.get("variant_id") ?? ""),
            usage_rights_note: String(fd.get("usage_rights_note") ?? ""),
            is_active: fd.get("is_active") === "on",
          });
          onSaved(r.ok);
        });
      }}>
      <input name="alt_text" defaultValue={img.alt_text} className="field !min-h-10 !py-2 sm:col-span-2" placeholder="Mô tả ảnh (alt text)" aria-label="Mô tả ảnh" />
      <select name="image_type" value={imgType} onChange={(e) => setImgType(e.target.value)} className="field !min-h-10 !py-2" aria-label="Góc nhìn">
        {Object.entries(IMAGE_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      <div className="flex items-center gap-2">
        <span className="size-6 shrink-0 rounded-full border border-black/10" style={current ? swatchStyle(current) : { background: "transparent" }} aria-hidden />
        <select name="color_name" value={colorName} onChange={(e) => setColorName(e.target.value)} className="field !min-h-10 !py-2" aria-label={imgType === "interior" ? "Màu nội thất" : "Màu xe"}>
          <option value="">{imgType === "interior" ? "Không gắn màu nội thất" : "Không gắn màu xe"}</option>
          {options.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          {legacy ? <option value={colorName}>{colorName} (không có trong bảng màu)</option> : null}
        </select>
      </div>
      <select name="variant_id" defaultValue={img.variant_id ?? ""} className="field !min-h-10 !py-2" aria-label="Phiên bản">
        <option value="">Mọi phiên bản</option>
        {variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
      </select>
      <input name="usage_rights_note" defaultValue={img.usage_rights_note ?? ""} className="field !min-h-10 !py-2" placeholder="Quyền sử dụng / nguồn" aria-label="Quyền sử dụng" />
      <div className="flex items-center justify-between gap-2 sm:col-span-2">
        <label className="flex items-center gap-2"><input type="checkbox" name="is_active" defaultChecked={img.is_active} className="size-4" /> Hiển thị</label>
        <span className="truncate text-xs text-steel" title={img.image_url}>{img.storage_path ? "Supabase Storage" : img.source_url ?? img.image_url}</span>
        <button className="btn btn-ghost btn-sm" disabled={pending}>Lưu</button>
      </div>
    </form>
  );
}
