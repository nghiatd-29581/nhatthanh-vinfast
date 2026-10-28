"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Phone, X } from "lucide-react";

const NAV = [
  { href: "/xe", label: "Dòng xe" },
  { href: "/so-sanh", label: "So sánh" },
  { href: "/du-toan-chi-phi", label: "Dự toán chi phí" },
  { href: "/uu-dai", label: "Ưu đãi" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/lien-he", label: "Liên hệ" },
];

export function HeaderNav({ name, hotline, tel }: { name: string; hotline: string; tel: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const overHero = pathname === "/" && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        overHero ? "bg-transparent text-white" : "border-b border-white/5 bg-ink/92 text-white backdrop-blur-md"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4 md:h-[72px]">
        <Link href="/" className="flex items-baseline gap-2" aria-label={`${name} — trang chủ`}>
          <span className="text-[17px] font-extrabold tracking-[-0.02em]">Nhật Thanh</span>
          <span className="text-[13px] font-medium text-white/60">VinFast</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng chính">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith(n.href) ? "bg-white/10 text-white" : "text-white/70 hover:text-white"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href={tel} className="btn btn-primary btn-sm" aria-label={`Gọi hotline ${hotline}`}>
            <Phone className="size-4" aria-hidden />
            <span className="hidden sm:inline tabular-nums">{hotline}</span>
            <span className="sm:hidden">Gọi</span>
          </a>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-white/20 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Đóng menu" : "Mở menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-white/10 bg-ink lg:hidden" aria-label="Điều hướng di động">
          <ul className="container-x flex flex-col py-3">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="block border-b border-white/5 py-4 text-lg font-semibold">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
