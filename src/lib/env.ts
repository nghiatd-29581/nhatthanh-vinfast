export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Khi chưa cấu hình Supabase, website public chạy bằng dữ liệu mẫu (demo) để dựng giao diện. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** Danh sách host ảnh được phép tối ưu qua next/image (khớp next.config.ts) */
export function allowedImageHosts(): string[] {
  const hosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean);
  try {
    if (SUPABASE_URL) hosts.push(new URL(SUPABASE_URL).hostname);
  } catch {}
  return hosts;
}
