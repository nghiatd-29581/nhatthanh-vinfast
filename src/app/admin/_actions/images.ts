"use server";
import { revalidatePath } from "next/cache";
import { assertStaff } from "@/lib/auth";

const TYPES = ["exterior", "interior", "detail", "color"];

export interface ImageInput {
  image_url: string;
  storage_path?: string | null;
  alt_text?: string;
  image_type?: string;
  color_name?: string | null;
  variant_id?: string | null;
  usage_rights_note?: string | null;
  source_url?: string | null;
}

function cleanUrl(u: string): string | null {
  try {
    const url = new URL(u);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function addImages(vehicleId: string, items: ImageInput[]): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await assertStaff();
  const { data: last } = await supabase.from("vehicle_images").select("sort_order").eq("vehicle_id", vehicleId).order("sort_order", { ascending: false }).limit(1);
  let order = (last?.[0]?.sort_order ?? 0) + 1;
  const rows = [];
  for (const i of items.slice(0, 50)) {
    const url = cleanUrl(i.image_url);
    if (!url) return { ok: false, error: "URL ảnh phải bắt đầu bằng https://" };
    rows.push({
      vehicle_id: vehicleId,
      image_url: url,
      storage_path: i.storage_path ?? null,
      alt_text: (i.alt_text ?? "").slice(0, 200),
      image_type: TYPES.includes(i.image_type ?? "") ? i.image_type : "exterior",
      color_name: i.color_name || null,
      variant_id: i.variant_id || null,
      usage_rights_note: i.usage_rights_note || null,
      source_url: i.source_url || null,
      sort_order: order++,
    });
  }
  const { error } = await supabase.from("vehicle_images").insert(rows);
  if (error) return { ok: false, error: "Không lưu được ảnh" };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateImage(id: string, patch: Partial<ImageInput & { is_active: boolean }>): Promise<{ ok: boolean }> {
  const { supabase } = await assertStaff();
  const clean: Record<string, unknown> = {};
  if (patch.alt_text !== undefined) clean.alt_text = patch.alt_text.slice(0, 200);
  if (patch.image_type && TYPES.includes(patch.image_type)) clean.image_type = patch.image_type;
  if (patch.color_name !== undefined) clean.color_name = patch.color_name || null;
  if (patch.variant_id !== undefined) clean.variant_id = patch.variant_id || null;
  if (patch.usage_rights_note !== undefined) clean.usage_rights_note = patch.usage_rights_note || null;
  if (patch.is_active !== undefined) clean.is_active = patch.is_active;
  if (patch.image_url !== undefined) {
    const u = cleanUrl(patch.image_url);
    if (!u) return { ok: false };
    clean.image_url = u;
  }
  const { error } = await supabase.from("vehicle_images").update(clean).eq("id", id);
  revalidatePath("/", "layout");
  return { ok: !error };
}

export async function reorderImages(vehicleId: string, ids: string[]): Promise<{ ok: boolean }> {
  const { supabase } = await assertStaff();
  const results = await Promise.all(ids.map((id, i) => supabase.from("vehicle_images").update({ sort_order: i + 1 }).eq("id", id).eq("vehicle_id", vehicleId)));
  revalidatePath("/", "layout");
  return { ok: results.every((r) => !r.error) };
}

export async function setCoverImage(vehicleId: string, imageId: string): Promise<{ ok: boolean }> {
  const { supabase } = await assertStaff();
  const { data: img } = await supabase.from("vehicle_images").select("image_url").eq("id", imageId).eq("vehicle_id", vehicleId).single();
  if (!img) return { ok: false };
  await supabase.from("vehicle_images").update({ is_cover: false }).eq("vehicle_id", vehicleId);
  await supabase.from("vehicle_images").update({ is_cover: true }).eq("id", imageId);
  await supabase.from("vehicles").update({ cover_image: img.image_url }).eq("id", vehicleId);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteImage(vehicleId: string, imageId: string): Promise<{ ok: boolean }> {
  const { supabase } = await assertStaff();
  const { data: img } = await supabase.from("vehicle_images").select("storage_path, is_cover").eq("id", imageId).eq("vehicle_id", vehicleId).single();
  if (!img) return { ok: false };
  if (img.storage_path) await supabase.storage.from("vehicle-images").remove([img.storage_path]);
  await supabase.from("vehicle_images").delete().eq("id", imageId);
  if (img.is_cover) await supabase.from("vehicles").update({ cover_image: null }).eq("id", vehicleId);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Kiểm tra URL ảnh lỗi (HEAD request, timeout 6s). Chỉ staff gọi được, chỉ chấp nhận https. */
export async function checkImageUrls(urls: string[]): Promise<Record<string, boolean>> {
  await assertStaff();
  const out: Record<string, boolean> = {};
  await Promise.all(
    urls.slice(0, 60).map(async (u) => {
      const url = cleanUrl(u);
      if (!url) return void (out[u] = false);
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6000);
        let res = await fetch(url, { method: "HEAD", signal: ctrl.signal, redirect: "follow", cache: "no-store" });
        if (res.status === 405) res = await fetch(url, { method: "GET", signal: ctrl.signal, cache: "no-store" });
        clearTimeout(t);
        out[u] = res.ok && (res.headers.get("content-type") ?? "image/").startsWith("image/");
      } catch {
        out[u] = false;
      }
    }),
  );
  return out;
}
