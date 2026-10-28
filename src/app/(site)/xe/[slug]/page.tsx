import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Phone } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { VehicleStage } from "@/components/site/VehicleStage";
import { VariantPanel } from "@/components/site/VariantPanel";
import { LoanCalculator } from "@/components/site/LoanCalculator";
import { PromotionList } from "@/components/site/PromotionList";
import { VehicleCard } from "@/components/site/VehicleCard";
import { LeadForm } from "@/components/site/LeadForm";
import { PostCard } from "@/components/news/PostCard";
import { getPosts } from "@/lib/post-data";
import { getImages, getPromotions, getSiteData, getVariants, getVehicleBySlug, getVehicles } from "@/lib/data";
import { formatDate, formatVnd, publicPrice, telHref } from "@/lib/format";
import { toStage } from "@/lib/vehicle-view";
import { SITE_URL } from "@/lib/env";
import { SALES_STATUS_LABELS } from "@/lib/constants";

export const revalidate = 60;

export async function generateStaticParams() {
  const vehicles = await getVehicles();
  return vehicles.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) return { title: "Không tìm thấy mẫu xe" };
  const title = v.seo_title || `${v.name} — giá, phiên bản, thông số`;
  const description = v.seo_description || v.short_description || `Tìm hiểu ${v.name}: phiên bản, màu sắc, thông số và nhận báo giá cùng Nhật Thanh VinFast.`;
  return {
    title,
    description,
    alternates: { canonical: `/xe/${v.slug}` },
    openGraph: { title, description, url: `/xe/${v.slug}`, images: v.cover_image ? [{ url: v.cover_image, alt: v.name }] : undefined },
  };
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) notFound();

  const [variants, images, promotions, all, site, vPosts] = await Promise.all([getVariants(v.id), getImages(v.id), getPromotions(), getVehicles(), getSiteData(), getPosts({ vehicleId: v.id, perPage: 3 })]);
  const price = publicPrice(v);
  const vPromos = promotions.filter((p) => p.vehicle_id === v.id || p.vehicle_id === null);
  const related = all.filter((x) => x.id !== v.id && (x.category_id === v.category_id || !v.category_id)).slice(0, 3);
  const tel = telHref(site.contact.hotline_tel || site.contact.hotline);
  const cover = images.find((i) => i.is_cover)?.image_url ?? v.cover_image;

  // Structured data: chỉ khai báo giá khi đã xác minh; không khai báo tình trạng kho
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Car",
      name: v.name,
      brand: { "@type": "Brand", name: "VinFast" },
      description: v.short_description ?? undefined,
      image: cover ?? undefined,
      url: `${SITE_URL}/xe/${v.slug}`,
      vehicleSeatingCapacity: v.seats ?? undefined,
      ...(v.price_verified && v.starting_price
        ? { offers: { "@type": "Offer", priceCurrency: "VND", price: v.starting_price, url: `${SITE_URL}/xe/${v.slug}`, seller: { "@type": "Person", name: site.contact.display_name } } }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Dòng xe", item: `${SITE_URL}/xe` },
        { "@type": "ListItem", position: 3, name: v.name, item: `${SITE_URL}/xe/${v.slug}` },
      ],
    },
    ...(v.faqs?.length
      ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: v.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }]
      : []),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* 1–5. Breadcrumb, tên, ảnh hero, giá, CTA */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_10%,rgba(232,234,237,.12),transparent_70%)]" />
        <div className="container-x relative pb-12 pt-24 md:pt-32">
          <nav aria-label="Breadcrumb" className="text-sm text-white/55">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-white">Trang chủ</Link></li>
              <li aria-hidden><ChevronRight className="size-3.5" /></li>
              <li><Link href="/xe" className="hover:text-white">Dòng xe</Link></li>
              <li aria-hidden><ChevronRight className="size-3.5" /></li>
              <li aria-current="page" className="text-white">{v.name}</li>
            </ol>
          </nav>
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="display text-[clamp(2.8rem,1.6rem+5vw,6rem)]">{v.name}</h1>
              <p className="mt-3 text-white/60">
                {v.category?.name ?? "Phân khúc đang cập nhật"} <span className="text-white/30">/</span> {SALES_STATUS_LABELS[v.sales_status]}
                {variants.length ? <> <span className="text-white/30">/</span> {variants.length} phiên bản</> : null}
              </p>
            </div>
            <div className="md:text-right">
              <p className="text-3xl font-extrabold tracking-[-0.03em] md:text-4xl">{price.label}</p>
              <p className="mt-1 text-sm text-white/50">
                {v.price_verified ? <>Cập nhật {formatDate(v.price_updated_at)}{v.price_source ? ` • Nguồn: ${v.price_source}` : ""}</> : "Giá đang chờ xác minh"}
              </p>
              {v.price_verified && v.listed_price ? <p className="text-sm text-white/50">Giá niêm yết: {formatVnd(v.listed_price)}</p> : null}
            </div>
          </div>
          <div className="relative mt-8 aspect-[16/8] md:aspect-[16/7]">
            <SafeImage src={cover} alt={`${v.name} — ngoại thất`} fill priority sizes="100vw" className="object-contain object-bottom" dark />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#bao-gia" className="btn btn-primary">Nhận báo giá {v.name.replace(/^VinFast\s+/i, "")}</a>
            <Link href={`/lien-he?nhu-cau=test_drive&xe=${v.slug}#dang-ky`} className="btn btn-ghost-dark">Đăng ký lái thử</Link>
            <a href={tel} className="btn btn-ghost-dark"><Phone className="size-4" aria-hidden /> {site.contact.hotline}</a>
          </div>
          {v.price_note ? <p className="mt-4 max-w-2xl text-sm text-white/50">{v.price_note}</p> : null}
        </div>
      </section>

      {/* 6–7. Gallery, chọn màu */}
      <section className="bg-ink pb-20 text-white" aria-label="Hình ảnh và màu sắc">
        <div className="container-x">
          <VehicleStage vehicle={toStage(v)} images={images} />
        </div>
      </section>

      {v.description ? (
        <section className="container-x py-16 md:py-20">
          <div className="max-w-3xl whitespace-pre-line text-lg leading-relaxed text-ink/85">{v.description}</div>
        </section>
      ) : null}

      {/* 8–9. Phiên bản, thông số */}
      <section className="container-x py-16 md:py-20" aria-labelledby="phien-ban">
        <h2 id="phien-ban" className="h-section">{variants.length ? "Phiên bản và thông số" : "Thông số kỹ thuật"}</h2>
        <div className="mt-10"><VariantPanel variants={variants} vehicleSpecs={v.specifications} /></div>
        {v.data_source ? <p className="mt-6 text-xs text-steel">Nguồn dữ liệu: {v.data_source}</p> : null}
      </section>

      {/* 10. Tính năng nổi bật */}
      {v.highlights?.length ? (
        <section className="border-t border-silver" aria-labelledby="noi-bat">
          <div className="container-x py-16 md:py-20">
            <h2 id="noi-bat" className="h-section">Điểm nổi bật</h2>
            <ul className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
              {v.highlights.map((h) => (
                <li key={h.title} className="border-t-2 border-ink pt-5">
                  <h3 className="text-lg font-bold">{h.title}</h3>
                  <p className="mt-2 text-steel">{h.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* 11. Trả góp */}
      <section className="bg-mist py-16 md:py-20" aria-labelledby="tra-gop">
        <div className="container-x">
          <h2 id="tra-gop" className="h-section">Ước tính trả góp {v.name}</h2>
          <div className="mt-10">
            <LoanCalculator finance={site.finance} defaultVehicleId={v.id}
              vehicles={[
                ...variants.map((x) => ({ id: x.id, name: `${v.name} ${x.name}`, price: x.price_verified ? x.price : null })),
                { id: v.id, name: v.name, price: v.price_verified ? v.starting_price : null },
              ]} />
          </div>
        </div>
      </section>

      {/* 12. Ưu đãi */}
      <section className="container-x py-16 md:py-20" aria-labelledby="uu-dai-xe">
        <h2 id="uu-dai-xe" className="h-section">Ưu đãi áp dụng</h2>
        <div className="mt-10"><PromotionList promotions={vPromos} /></div>
      </section>

      {/* 13. FAQ */}
      {v.faqs?.length ? (
        <section className="container-x pb-16 md:pb-20" aria-labelledby="faq">
          <h2 id="faq" className="h-section">Câu hỏi thường gặp</h2>
          <div className="mt-8 divide-y divide-silver border-y border-silver">
            {v.faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  {f.q}<span className="text-2xl text-steel transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-3 max-w-3xl text-steel">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {/* Bài viết về mẫu xe này (liên kết nội bộ cho SEO) */}
      {vPosts.posts.length ? (
        <section className="border-t border-silver" aria-labelledby="bai-viet-xe">
          <div className="container-x py-16 md:py-20">
            <h2 id="bai-viet-xe" className="h-section">Bài viết về {v.name}</h2>
            <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {vPosts.posts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          </div>
        </section>
      ) : null}

      {/* 14. Xe liên quan */}
      {related.length ? (
        <section className="border-t border-silver" aria-labelledby="lien-quan">
          <div className="container-x py-16 md:py-20">
            <h2 id="lien-quan" className="h-section">Có thể bạn quan tâm</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => <VehicleCard key={r.id} v={r} />)}
            </div>
          </div>
        </section>
      ) : null}

      {/* 15. Form */}
      <section id="bao-gia" className="scroll-mt-20 bg-ink py-16 text-white md:py-24" aria-labelledby="bao-gia-title">
        <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 id="bao-gia-title" className="h-section">Nhận báo giá {v.name}</h2>
            <p className="lede mt-4 !text-white/60">Báo giá gồm giá xe theo phiên bản, ưu đãi đang áp dụng và chi phí lăn bánh dự kiến tại địa phương của bạn.</p>
            <a href={tel} className="mt-8 inline-block text-4xl font-bold tracking-[-0.03em] tabular-nums hover:text-brand">{site.contact.hotline}</a>
          </div>
          <LeadForm dark sourcePage={`/xe/${v.slug}`} defaultVehicleId={v.id} vehicles={all.map((x) => ({ id: x.id, name: x.name }))} />
        </div>
      </section>
    </>
  );
}
