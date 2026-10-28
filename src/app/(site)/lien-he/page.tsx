import type { Metadata } from "next";
import { MessageCircle, Phone } from "lucide-react";
import { PageIntro } from "@/components/site/PageIntro";
import { LeadForm } from "@/components/site/LeadForm";
import { getSiteData, getVehicles } from "@/lib/data";
import { telHref } from "@/lib/format";
import type { InquiryType } from "@/lib/types";

export const metadata: Metadata = {
  title: "Liên hệ Nhật Thanh VinFast",
  description: "Gọi 0349.63.65.67 hoặc để lại thông tin để nhận báo giá, đăng ký lái thử và tư vấn trả góp ô tô VinFast.",
  alternates: { canonical: "/lien-he" },
};

const TYPES: InquiryType[] = ["quote", "test_drive", "finance", "promotion", "other"];

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ "nhu-cau"?: string; xe?: string }> }) {
  const [sp, site, vehicles] = await Promise.all([searchParams, getSiteData(), getVehicles()]);
  const inquiry = TYPES.includes(sp["nhu-cau"] as InquiryType) ? (sp["nhu-cau"] as InquiryType) : "quote";
  const vehicle = vehicles.find((v) => v.slug === sp.xe);
  const { contact } = site;
  const tel = telHref(contact.hotline_tel || contact.hotline);
  return (
    <>
      <PageIntro title="Liên hệ" lede="Gọi trực tiếp để được tư vấn ngay, hoặc để lại thông tin để Nhật Thanh gọi lại." />
      <section className="container-x grid gap-14 py-14 md:py-20 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-3xl font-extrabold tracking-[-0.03em]">{contact.display_name}</p>
          <a href={tel} className="mt-2 block text-5xl font-bold tracking-[-0.03em] text-brand tabular-nums">{contact.hotline}</a>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={tel} className="btn btn-primary"><Phone className="size-4" aria-hidden /> Gọi ngay</a>
            {contact.zalo_url ? <a href={contact.zalo_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><MessageCircle className="size-4" aria-hidden /> Nhắn Zalo</a> : null}
          </div>
          <dl className="mt-10 space-y-4 text-sm">
            {contact.email ? <div><dt className="text-steel">Email</dt><dd className="font-semibold"><a href={`mailto:${contact.email}`}>{contact.email}</a></dd></div> : null}
            {contact.address ? <div><dt className="text-steel">Địa chỉ</dt><dd className="font-semibold">{contact.address}</dd></div> : null}
            {contact.working_hours ? <div><dt className="text-steel">Thời gian làm việc</dt><dd className="font-semibold">{contact.working_hours}</dd></div> : null}
          </dl>
        </div>
        <div id="dang-ky" className="scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-[-0.02em]">Đăng ký tư vấn và lái thử</h2>
          <div className="mt-6">
            <LeadForm sourcePage="/lien-he" defaultInquiry={inquiry} defaultVehicleId={vehicle?.id} vehicles={vehicles.map((v) => ({ id: v.id, name: v.name }))} />
          </div>
        </div>
      </section>
    </>
  );
}
