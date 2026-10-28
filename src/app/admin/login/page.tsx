import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Đăng nhập quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  forbidden: "Tài khoản chưa được cấp quyền quản trị hoặc phiên đăng nhập đã hết hạn.",
  config: "Chưa cấu hình Supabase. Xem README để thiết lập biến môi trường.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  if (await getStaff()) redirect("/admin");
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8">
        <p className="text-xl font-extrabold tracking-[-0.02em]">Nhật Thanh VinFast</p>
        <p className="mb-6 text-sm text-steel">Đăng nhập trang quản trị</p>
        <LoginForm next={sp.next ?? "/admin"} initialError={sp.error ? ERRORS[sp.error] : undefined} />
      </div>
    </main>
  );
}
