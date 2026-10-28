"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BadgePercent, Car, FileText, Gauge, Images, LayoutTemplate, LogOut, Menu, Settings, Tag, Users, X } from "lucide-react";
import { signOut } from "@/app/admin/_actions/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: Gauge, exact: true },
  { href: "/admin/vehicles", label: "Quản lý xe", icon: Car },
  { href: "/admin/variants", label: "Phiên bản và hình ảnh", icon: Images },
  { href: "/admin/pricing", label: "Giá xe", icon: Tag },
  { href: "/admin/promotions", label: "Ưu đãi", icon: BadgePercent },
  { href: "/admin/leads", label: "Khách hàng tiềm năng", icon: Users },
  { href: "/admin/content", label: "Nội dung Landing Page", icon: LayoutTemplate },
  { href: "/admin/settings", label: "Liên hệ, SEO, tài chính", icon: Settings },
];

export function AdminNav({ name, role }: { name: string; role: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const links = (
    <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Quản trị">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
            <Icon className="size-4.5 shrink-0" aria-hidden /> {label}
          </Link>
        );
      })}
      <Link href="/" target="_blank" className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:text-white">
        <FileText className="size-4.5" aria-hidden /> Xem website
      </Link>
    </nav>
  );
  const footer = (
    <div className="border-t border-white/10 p-4">
      <p className="truncate text-sm font-semibold text-white">{name}</p>
      <p className="text-xs text-white/50">{role === "admin" ? "Quản trị viên" : "Biên tập viên"}</p>
      <form action={signOut} className="mt-3">
        <button className="flex items-center gap-2 text-sm text-white/70 hover:text-white"><LogOut className="size-4" aria-hidden /> Đăng xuất</button>
      </form>
    </div>
  );
  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-ink px-4 text-white lg:hidden">
        <span className="font-bold">Nhật Thanh — Quản trị</span>
        <button onClick={() => setOpen(!open)} aria-label={open ? "Đóng menu" : "Mở menu"} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="fixed inset-0 top-14 z-30 flex flex-col overflow-y-auto bg-ink lg:hidden">{links}{footer}</div>}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-ink lg:flex">
        <div className="px-6 py-5">
          <p className="text-lg font-extrabold tracking-[-0.02em] text-white">Nhật Thanh</p>
          <p className="text-xs text-white/50">Trang quản trị</p>
        </div>
        {links}
        {footer}
      </aside>
    </>
  );
}
