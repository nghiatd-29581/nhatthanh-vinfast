import Link from "next/link";
import { Phone } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import type { ContactSettings, HeroContent, Vehicle } from "@/lib/types";
import { telHref } from "@/lib/format";

export function Hero({ hero, contact, vehicle }: { hero: HeroContent; contact: ContactSettings; vehicle: Vehicle | null }) {
  const img = hero.image_url || vehicle?.cover_image || null;
  const alt = hero.image_alt || (vehicle ? `${vehicle.name}` : "Ô tô điện VinFast");
  const model = vehicle?.name.replace(/^VinFast\s+/i, "") ?? "VinFast";
  return (
    <section className="relative isolate overflow-hidden bg-ink text-white" aria-labelledby="hero-title">
      {/* Ánh sáng studio: một vệt sáng trần + mặt sàn phản chiếu */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_45%_at_60%_8%,rgba(232,234,237,.14),transparent_70%),radial-gradient(ellipse_70%_30%_at_55%_88%,rgba(20,100,244,.16),transparent_70%)]" />

      <div className="container-x relative flex min-h-[640px] flex-col pb-10 pt-24 md:min-h-[min(100svh,920px)] md:pb-14 md:pt-32">
        {/* Tên mẫu xe cỡ cực lớn — chữ chính là hình khối nền */}
        <p aria-hidden className="pointer-events-none absolute inset-x-0 top-[22%] select-none text-center font-extrabold leading-none tracking-[-0.06em] text-white/[0.045] md:top-[16%]" style={{ fontSize: "clamp(7rem, 26vw, 25rem)" }}>
          {model}
        </p>

        <div className="relative order-2 mt-auto max-w-2xl md:order-1 md:mt-0">
          <p className="rise text-sm font-semibold text-white/60" style={{ animationDelay: ".05s" }}>
            {contact.display_name} <span className="text-white/30">/</span> <a href={telHref(contact.hotline_tel || contact.hotline)} className="tabular-nums text-white hover:text-brand">{contact.hotline}</a>
          </p>
          <h1 id="hero-title" className="display rise mt-4 text-[clamp(2.6rem,1.6rem+4.6vw,5.6rem)]" style={{ animationDelay: ".12s" }}>
            {hero.title}
          </h1>
          <p className="rise mt-5 max-w-lg text-lg text-white/70" style={{ animationDelay: ".2s" }}>{hero.subtitle}</p>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: ".28s" }}>
            <Link href="/xe" className="btn btn-light">{hero.primary_cta}</Link>
            <Link href="/lien-he#dang-ky" className="btn btn-primary">{hero.secondary_cta}</Link>
            <Link href="/lien-he?nhu-cau=test_drive#dang-ky" className="btn btn-ghost-dark">{hero.tertiary_cta}</Link>
          </div>
          <a href={telHref(contact.hotline_tel || contact.hotline)} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white md:hidden">
            <Phone className="size-4" aria-hidden /> Gọi {contact.hotline}
          </a>
        </div>

        <div className="hero-car hero-sweep relative order-1 -mx-5 mt-4 aspect-[16/9] md:absolute md:inset-x-0 md:bottom-0 md:order-2 md:mx-0 md:mt-0 md:aspect-auto md:h-[62%] md:translate-x-[14%]">
          <SafeImage src={img} alt={alt} fill priority sizes="(min-width:768px) 80vw, 100vw" className="object-contain object-bottom" dark placeholderLabel="Ảnh minh họa — cập nhật ảnh hero trong Admin" />
          <div className="pointer-events-none absolute inset-x-[10%] bottom-0 h-6 rounded-[50%] bg-black/60 blur-xl" aria-hidden />
        </div>
      </div>
    </section>
  );
}
