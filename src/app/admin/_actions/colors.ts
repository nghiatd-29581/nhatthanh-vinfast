"use server";
import { revalidatePath } from "next/cache";
import { assertStaff } from "@/lib/auth";
import { normalizeColors } from "@/lib/colors";
import type { ColorOption, ColorType } from "@/lib/types";

export interface ColorRename { from: string; to: string; type: ColorType }

/**
 * Lưu bảng màu của xe (ngoại thất + nội thất).
 * - Đổi tên màu → ảnh đang gắn tên cũ được cập nhật sang tên mới.
 * - Xoá màu → ảnh đang gắn màu đó được bỏ gắn màu (ảnh vẫn giữ).
 * Màu ngoại thất áp dụng cho ảnh ngoại thất/chi tiết/màu sắc; màu nội thất áp dụng cho ảnh nội thất.
 */
export async function saveVehicleColors(vehicleId: string, input: ColorOption[], renames: ColorRename[]): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await assertStaff();
  const colors = normalizeColors(input).slice(0, 60);
  for (const type of ["exterior", "interior"] as const) {
    const names = colors.filter((c) => c.type === type).map((c) => c.name.toLowerCase());
    const dup = names.find((n, i) => names.indexOf(n) !== i);
    if (dup) return { ok: false, error: `Tên màu ${type === "interior" ? "nội thất" : "ngoại thất"} “${dup}” bị trùng.` };
  }

  const { data: before } = await supabase.from("vehicles").select("colors, slug").eq("id", vehicleId).single();
  if (!before) return { ok: false, error: "Không tìm thấy xe." };

  const { error } = await supabase.from("vehicles").update({ colors }).eq("id", vehicleId);
  if (error) return { ok: false, error: "Không lưu được bảng màu." };

  const scope = (type: ColorType) => (type === "interior" ? ["interior"] : ["exterior", "detail", "color"]);

  // Đổi tên
  for (const r of renames) {
    if (!r.from || !r.to || r.from === r.to) continue;
    await supabase.from("vehicle_images").update({ color_name: r.to }).eq("vehicle_id", vehicleId).eq("color_name", r.from).in("image_type", scope(r.type));
  }
  // Bỏ gắn màu đã xoá
  const renamedFrom = new Set(renames.map((r) => `${r.type}:${r.from}`));
  for (const old of normalizeColors(before.colors)) {
    const t = old.type ?? "exterior";
    const still = colors.some((c) => c.type === t && c.name === old.name);
    if (!still && !renamedFrom.has(`${t}:${old.name}`)) {
      await supabase.from("vehicle_images").update({ color_name: null }).eq("vehicle_id", vehicleId).eq("color_name", old.name).in("image_type", scope(t));
    }
  }

  revalidatePath("/", "layout");
  revalidatePath(`/xe/${before.slug}`);
  return { ok: true };
}
