"use client";
import { createBrowserClient } from "@supabase/ssr";

/** Client trình duyệt — chỉ dùng anon key; mọi quyền ghi do RLS kiểm soát */
export function createBrowserSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
