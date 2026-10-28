"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertStaff } from "@/lib/auth";
import { bool, localToIso, str } from "@/lib/admin-format";
import { PROMO_TYPE_LABELS } from "@/lib/constants";

export async function savePromotion(formData: FormData) {
  const { supabase } = await assertStaff();
  const id = str(formData.get("id"));
  const title = str(formData.get("title"));
  const back = `/admin/promotions/${id ?? "new"}`;
  if (!title) redirect(`${back}?error=${encodeURIComponent("Vui lòng nhập tên chương trình")}`);
  const start = localToIso(formData.get("start_at"));
  const end = localToIso(formData.get("end_at"));
  if (start && end && new Date(end) <= new Date(start)) redirect(`${back}?error=${encodeURIComponent("Ngày kết thúc phải sau ngày bắt đầu")}`);
  const type = String(formData.get("promo_type"));
  const payload = {
    title,
    description: str(formData.get("description")),
    promo_type: type in PROMO_TYPE_LABELS ? type : "other",
    vehicle_id: str(formData.get("vehicle_id")),
    start_at: start,
    end_at: end,
    terms: str(formData.get("terms")),
    source_note: str(formData.get("source_note")),
    is_published: bool(formData.get("is_published")),
  };
  const { data, error } = id
    ? await supabase.from("promotions").update(payload).eq("id", id).select("id").single()
    : await supabase.from("promotions").insert(payload).select("id").single();
  if (error || !data) redirect(`${back}?error=${encodeURIComponent("Không lưu được ưu đãi")}`);
  revalidatePath("/", "layout");
  redirect(`/admin/promotions?ok=${encodeURIComponent("Đã lưu ưu đãi")}`);
}

export async function deletePromotion(formData: FormData) {
  const { supabase } = await assertStaff();
  await supabase.from("promotions").delete().eq("id", String(formData.get("id")));
  revalidatePath("/", "layout");
  redirect(`/admin/promotions?ok=${encodeURIComponent("Đã xoá ưu đãi")}`);
}
