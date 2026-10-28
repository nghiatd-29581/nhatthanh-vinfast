import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { getSiteData, getVehicles } from "@/lib/data";
import { formatDate, telHref } from "@/lib/format";
import { DISCLAIMER, OFFICIAL_SOURCE } from "@/lib/constants";

export async function Footer() {
  const [{ contact, notices }, vehicles] = await Promise.all([getSiteData(), getVehicles()]);
  const tel = telHref(contact.hotline_tel || contact.hotline);
  return (
    <footer className="bg-ink text-white">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:py-20">
        <div>
          <p className="text-3xl font-extrabold tracking-[-0.03em]">{contact.display_name}</p>
          <a href={tel} className="mt-3 block text-4xl font-bold tracking-[-0.02em] tabular-nums text-white hover:text-brand md:text-5xl">
            {contact.hotline}
          </a>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={tel} className="btn btn-primary">
              <Phone className="size-4" aria-hidden /> Gọi ngay
            </a>
            {contact.zalo_url ? (
              <a href={contact.zalo_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-dark">
                <MessageCircle className="size-4" aria-hidden /> Nhắn Zalo
              </a>
            ) : null}
          </div>
          {contact.address ? <p className="mt-6 text-sm text-white/60">{contact.address}</p> : null}
          {contact.working_hours ? <p className="mt-1 text-sm text-white/60">{contact.working_hours}</p> : null}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white/50">Dòng xe</h2>
          <ul className="mt-4 space-y-2.5">
            {vehicles.slice(0, 10).map((v) => (
              <li key={v.id}>
                <Link href={`/xe/${v.slug}`} className="text-white/80 hover:text-white">
                  {v.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white/50">Thông tin</h2>
          <ul className="mt-4 space-y-2.5 text-white/80">
            <li><Link href="/uu-dai" className="hover:text-white">Ưu đãi</Link></li>
            <li><Link href="/du-toan-chi-phi" className="hover:text-white">Dự toán chi phí</Link></li>
            <li><Link href="/chinh-sach-quyen-rieng-tu" className="hover:text-white">Chính sách quyền riêng tư</Link></li>
            <li><Link href="/dieu-khoan-su-dung" className="hover:text-white">Điều khoản sử dụng</Link></li>
            <li>
              <a href={OFFICIAL_SOURCE} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                Nguồn tham khảo: vinfastauto.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-3 py-6 text-[13px] leading-relaxed text-white/50 md:flex-row md:justify-between">
          <p className="max-w-3xl">{DISCLAIMER}</p>
          <p className="shrink-0">Dữ liệu cập nhật: {formatDate(notices.data_updated_at)}</p>
        </div>
      </div>
    </footer>
  );
}
