import "server-only";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export interface StaffUser { id: string; email: string | null; full_name: string | null; role: "admin" | "editor" }

/** Lấy user hiện tại nếu là admin/editor; ngược lại null. Xác minh qua getUser() (gọi Supabase Auth server). */
export async function getStaff(): Promise<StaffUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", data.user.id).maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) return null;
  return { id: data.user.id, email: data.user.email ?? null, full_name: profile.full_name, role: profile.role };
}

/** Dùng trong trang Admin: chuyển về login nếu không đủ quyền */
export async function requireStaff(): Promise<StaffUser> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login?error=forbidden");
  return staff;
}

/** Dùng trong Server Action: ném lỗi nếu không đủ quyền */
export async function assertStaff() {
  const staff = await getStaff();
  if (!staff) throw new Error("FORBIDDEN");
  const supabase = await createSessionClient();
  return { staff, supabase };
}
