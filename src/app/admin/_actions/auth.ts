"use server";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function signIn(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Chưa cấu hình Supabase. Xem README để thiết lập biến môi trường." };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  if (!email || !password) return { error: "Vui lòng nhập email và mật khẩu." };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Email hoặc mật khẩu không đúng." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    await supabase.auth.signOut();
    return { error: "Tài khoản chưa được cấp quyền quản trị." };
  }
  redirect(next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}
