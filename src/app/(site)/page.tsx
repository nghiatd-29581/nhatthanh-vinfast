import Link from "next/link";
import { Hero } from "@/components/site/Hero";
import { SectionHead } from "@/components/site/SectionHead";
import { VehicleCard } from "@/components/site/VehicleCard";
import { VehicleExplorer } from "@/components/site/VehicleExplorer";
import { ShowcaseSwitcher } from "@/components/site/ShowcaseSwitcher";
import { PromotionList } from "@/components/site/PromotionList";
import { LoanCalculator } from "@/components/site/LoanCalculator";
import { CompareTool } from "@/components/site/CompareTool";
import { LeadForm } from "@/components/site/LeadForm";
import { getAbout, getAllVariants, getCategories, getHero, getImagesForVehicles, getPromotions, getSiteData, getVehicles } from "@/lib/data";
import { telHref } from "@/lib/format";
import { toStage } from "@/lib/vehicle-view";

export const revalidate = 60;

export default async function HomePage() {
  const [hero, about, site, vehicles, categories, promotions, variants] = await Promise.all([
    getHero(), getAbout(), getSiteData(), getVehicles(), getCategories(), getPromotions(), getAllVariants(),
  ]);
  const landing = vehicles.filter((v) => v.show_on_landing);
  const heroVehicle = vehicles.find((v) => v.slug === hero.vehicle_slug) ?? landing.find((v) => v.is_featured) ?? landing[0] ?? null;
  const showcase = (landing.filter((v) => v.is_featured).length ? landing.filter((v) => v.is_featured) : landing).slice(0, 5);
  const showcaseImages = await getImagesForVehicles(showcase.map((v) => v.id));
  const tel = telHref(site.contact.hotline_tel || site.contact.hotline);
  const cards = Object.fromEntries(landing.map((v, i) => [v.id, <VehicleCard key={v.id} v={v} priority={i < 3} />]));
  const usedCategories = categories.filter((c) => landing.some((v) => v.category_id === c.id));

  return (
    <>
      <Hero hero={hero} contact={site.contact} vehicle={heroVehicle} />

      {/* 2. Danh mục xe */}
      <section className="container-x py-20 md:py-28" aria-labelledby="dong-xe">
        <SectionHead id="dong-xe" title="Các dòng xe" lede="Chọn mẫu xe để xem phiên bản, màu sắc và nhận báo giá cập nhật." action={{ href: "/xe", label: "Xem tất cả dòng xe" }} />
        <div className="mt-10">
          <VehicleExplorer vehicles={landing} categories={usedCategories} cards={cards} />
        </div>
      </section>

      {/* 3. Khám phá chi tiết */}
      {showcase.length > 0 && (
        <section className="bg-ink py-20 text-white md:py-28" aria-labelledby="kham-pha">
          <div className="container-x">
            <h2 id="kham-pha" className="sr-only">Khám phá chi tiết xe</h2>
            <ShowcaseSwitcher items={showcase.map((v) => ({ id: v.id, slug: v.slug, stage: toStage(v), images: showcaseImages.filter((i) => i.vehicle_id === v.id) }))} />
          </div>
        </section>
      )}

      {/* 4. Ưu đãi */}
      <section className="container-x py-20 md:py-28" aria-labelledby="uu-dai">
        <SectionHead id="uu-dai" title="Ưu đãi đang áp dụng" lede={site.notices.price_notice} action={promotions.length ? { href: "/uu-dai", label: "Tất cả ưu đãi" } : undefined} />
        <div className="mt-10 reveal"><PromotionList promotions={promotions.slice(0, 4)} /></div>
      </section>

      {/* 5. Dự toán trả góp */}
      <section className="bg-mist py-20 md:py-28" aria-labelledby="tra-gop">
        <div className="container-x">
          <SectionHead id="tra-gop" title="Ước tính khoản trả góp" lede="Thử các mức trả trước và thời hạn vay để thấy khoản phải trả hằng tháng. Kết quả là ước tính, kèm giải thích cách tính." />
          <div className="mt-10">
            <LoanCalculator finance={site.finance} vehicles={vehicles.map((v) => ({ id: v.id, name: v.name, price: v.price_verified ? v.starting_price : null }))} />
          </div>
        </div>
      </section>

      {/* 6. So sánh */}
      {vehicles.length >= 2 && (
        <section className="container-x py-20 md:py-28" aria-labelledby="so-sanh">
          <SectionHead id="so-sanh" title="Đặt các mẫu xe cạnh nhau" lede="So sánh tối đa 3 mẫu theo giá, kích thước, quãng đường và trang bị." action={{ href: "/so-sanh", label: "Mở trang so sánh" }} />
          <div className="mt-10">
            <CompareTool vehicles={vehicles} variants={variants} initial={vehicles.slice(0, 2).map((v) => v.slug)} />
          </div>
        </section>
      )}

      {/* 7. Vì sao chọn Nhật Thanh */}
      <section className="border-t border-silver" aria-labelledby="vi-sao">
        <div className="container-x grid gap-12 py-20 md:grid-cols-[1fr_1.1fr] md:py-28">
          <div className="md:sticky md:top-28 md:self-start">
            <h2 id="vi-sao" className="h-section">{about.title}</h2>
            <p className="mt-10 text-[clamp(2.4rem,1.5rem+3.4vw,4.4rem)] font-extrabold leading-[0.95] tracking-[-0.045em]">{site.contact.display_name.toUpperCase()}</p>
            <a href={tel} className="mt-3 block text-[clamp(2rem,1.3rem+2.6vw,3.6rem)] font-bold tracking-[-0.03em] text-brand tabular-nums hover:text-brand-deep">{site.contact.hotline}</a>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={tel} className="btn btn-primary">Gọi tư vấn</a>
              {site.contact.zalo_url ? <a href={site.contact.zalo_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Nhắn Zalo</a> : null}
            </div>
          </div>
          <ul className="divide-y divide-silver border-y border-silver">
            {about.points.map((p) => (
              <li key={p.title} className="py-7">
                <h3 className="text-xl font-bold tracking-[-0.02em]">{p.title}</h3>
                <p className="mt-2 text-steel">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 8. Đăng ký */}
      <section id="dang-ky" className="bg-ink py-20 text-white md:py-28" aria-labelledby="dang-ky-title">
        <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 id="dang-ky-title" className="h-section">Đăng ký tư vấn và lái thử</h2>
            <p className="lede mt-4 !text-white/60">Để lại số điện thoại, Nhật Thanh sẽ gọi lại vào khung giờ bạn chọn. Muốn nói chuyện ngay? Gọi <a href={tel} className="font-semibold text-white underline underline-offset-4">{site.contact.hotline}</a>.</p>
            <p className="mt-8 text-sm text-white/40">Xem thêm: <Link href="/uu-dai" className="underline">ưu đãi</Link>, <Link href="/du-toan-chi-phi" className="underline">dự toán chi phí</Link>.</p>
          </div>
          <LeadForm dark sourcePage="/" vehicles={vehicles.map((v) => ({ id: v.id, name: v.name }))} />
        </div>
      </section>
    </>
  );
}
