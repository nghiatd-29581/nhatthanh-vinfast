"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertStaff } from "@/lib/auth";
import { localToIso, str } from "@/lib/admin-format";
import { LEAD_STATUS_LABELS } from "@/lib/constants";

export async function updateLead(formData: FormData) {
  const { supabase, staff } = await assertStaff();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const patch: Record<string, unknown> = {
    next_contact_at: localToIso(formData.get("next_contact_at")),
    appointment_at: localToIso(formData.get("appointment_at")),
  };
  if (status in LEAD_STATUS_LABELS) patch.status = status;

  const note = str(formData.get("new_note"));
  if (note) {
    const { data: cur } = await supabase.from("leads").select("internal_notes").eq("id", id).single();
    const stamp = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const who = staff.full_name || staff.email || "Admin";
    patch.internal_notes = `[${stamp} — ${who}] ${note.slice(0, 2000)}${cur?.internal_notes ? `\n${cur.internal_notes}` : ""}`;
  }
  const { error } = await supabase.from("leads").update(patch).eq("id", id);
  revalidatePath("/admin", "layout");
  redirect(`/admin/leads/${id}?${error ? "error=" + encodeURIComponent("Không cập nhật được") : "ok=" + encodeURIComponent("Đã cập nhật khách hàng")}`);
}

export async function quickLeadStatus(formData: FormData) {
  const { supabase } = await assertStaff();
  const status = String(formData.get("status"));
  if (status in LEAD_STATUS_LABELS) await supabase.from("leads").update({ status }).eq("id", String(formData.get("id")));
  revalidatePath("/admin", "layout");
  redirect(String(formData.get("back") ?? "/admin/leads"));
}
