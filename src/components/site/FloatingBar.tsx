"use client";
import Link from "next/link";
import { useEffect } from "react";
import { FileText, MessageCircle, Phone } from "lucide-react";

/** Thanh liên hệ cố định trên mobile; body được chừa padding đáy (globals.css) để không che nút gửi form */
export function FloatingBar({ tel, zaloUrl }: { tel: string; zaloUrl: string }) {
  useEffect(() => {
    document.body.classList.add("has-floating-bar");
    return () => document.body.classList.remove("has-floating-bar");
  }, []);

  const item = "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[12px] font-semibold";
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95 text-white backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-[68px] items-stretch px-2">
        <a href={tel} className={`${item} text-white`}>
          <Phone className="size-5" aria-hidden /> Gọi điện
        </a>
        {zaloUrl ? (
          <a href={zaloUrl} target="_blank" rel="noopener noreferrer" className={item}>
            <MessageCircle className="size-5" aria-hidden /> Zalo
          </a>
        ) : null}
        <Link href="/lien-he#dang-ky" className={`${item} m-1.5 rounded-2xl bg-brand`}>
          <FileText className="size-5" aria-hidden /> Nhận báo giá
        </Link>
      </div>
    </div>
  );
}

/** Nút nổi trên desktop: gọn, góc phải dưới */
export function DesktopContactDock({ tel, hotline, zaloUrl }: { tel: string; hotline: string; zaloUrl: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-40 hidden flex-col items-end gap-2 md:flex">
      {zaloUrl ? (
        <a href={zaloUrl} target="_blank" rel="noopener noreferrer" className="btn btn-light btn-sm shadow-lg shadow-black/10" aria-label="Nhắn Zalo">
          <MessageCircle className="size-4" aria-hidden /> Zalo
        </a>
      ) : null}
      <a href={tel} className="btn btn-primary shadow-lg shadow-brand/30" aria-label={`Gọi ${hotline}`}>
        <Phone className="size-4" aria-hidden /> <span className="tabular-nums">{hotline}</span>
      </a>
    </div>
  );
}
