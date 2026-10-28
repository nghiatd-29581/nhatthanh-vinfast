import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Phone } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Markdown } from "@/components/news/Markdown";
import { PostCard } from "@/components/news/PostCard";
import { LeadForm } from "@/components/site/LeadForm";
import { getPostBySlug, getRelatedPosts } from "@/lib/post-data";
import { getSiteData, getVehicles } from "@/lib/data";
import { extractToc, postDescription, readingMinutes, wordCount } from "@/lib/posts";
import { formatDate, telHref } from "@/lib/format";
import { SITE_URL } from "@/lib/env";

export const revalidate = 60;

// Trang bài viết được tạo khi có người truy cập lần đầu rồi cache (ISR), làm mới mỗi 60 giây hoặc khi Admin lưu bài
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPostBySlug((await params).slug);
  if (!p) return { title: "Không tìm thấy bài viết" };
  const title = p.seo_title || p.title;
  const description = postDescription(p);
  return {
    title,
    description,
    keywords: [p.focus_keyword, ...p.tags].filter(Boolean) as string[],
    alternates: { canonical: `/tin-tuc/${p.slug}` },
    authors: p.author_name ? [{ name: p.author_name }] : undefined,
    openGraph: {
      type: "article",
      title,
      description,
      url: `/tin-tuc/${p.slug}`,
      publishedTime: p.published_at ?? undefined,
      modifiedTime: p.updated_at,
      section: p.category?.name,
      tags: p.tags,
      images: p.cover_image ? [{ url: p.cover_image, alt: p.cover_alt ?? p.title }] : undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const p = await getPostBySlug((await params).slug);
  if (!p) notFound();
  const [related, site, vehicles] = await Promise.all([getRelatedPosts(p), getSiteData(), getVehicles()]);
  const toc = extractToc(p.content);
  const tel = telHref(site.contact.hotline_tel || site.contact.hotline);
  const author = p.author_name || site.contact.display_name;
  const url = `${SITE_URL}/tin-tuc/${p.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: p.title.slice(0, 110),
      description: postDescription(p),
      image: p.cover_image ? [p.cover_image] : undefined,
      datePublished: p.published_at,
      dateModified: p.updated_at,
      author: { "@type": "Person", name: author },
      publisher: { "@type": "Organization", name: site.contact.display_name },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      articleSection: p.category?.name,
      keywords: [p.focus_keyword, ...p.tags].filter(Boolean).join(", ") || undefined,
      wordCount: wordCount(p.content),
      inLanguage: "vi-VN",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Tin tức", item: `${SITE_URL}/tin-tuc` },
        ...(p.category ? [{ "@type": "ListItem", position: 3, name: p.category.name, item: `${SITE_URL}/tin-tuc/chuyen-muc/${p.category.slug}` }] : []),
        { "@type": "ListItem", position: p.category ? 4 : 3, name: p.title, item: url },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <header className="bg-ink pb-12 pt-28 text-white md:pb-16 md:pt-36">
        <div className="container-x">
          <nav aria-label="Breadcrumb" className="text-sm text-white/55">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-white">Trang chủ</Link></li>
              <li aria-hidden><ChevronRight className="size-3.5" /></li>
              <li><Link href="/tin-tuc" className="hover:text-white">Tin tức</Link></li>
              {p.category ? (
                <>
                  <li aria-hidden><ChevronRight className="size-3.5" /></li>
                  <li><Link href={`/tin-tuc/chuyen-muc/${p.category.slug}`} className="hover:text-white">{p.category.name}</Link></li>
                </>
              ) : null}
            </ol>
          </nav>
          <h1 className="display mt-6 max-w-4xl text-[clamp(2.1rem,1.4rem+3vw,4rem)] !leading-[1.05]">{p.title}</h1>
          {p.excerpt ? <p className="mt-5 max-w-3xl text-lg text-white/70">{p.excerpt}</p> : null}
          <p className="mt-6 text-sm text-white/55">
            {author} <span className="mx-2 text-white/25">/</span>
            <time dateTime={p.published_at ?? undefined}>{formatDate(p.published_at)}</time>
            {p.updated_at && p.published_at && new Date(p.updated_at).getTime() - new Date(p.published_at).getTime() > 864e5 ? (
              <> <span className="mx-2 text-white/25">/</span> Cập nhật {formatDate(p.updated_at)}</>
            ) : null}
            <span className="mx-2 text-white/25">/</span> {readingMinutes(p.content)} phút đọc
          </p>
        </div>
      </header>

      {p.cover_image ? (
        <div className="container-x -mt-px">
          <div className="relative mx-auto mt-8 aspect-[16/9] max-w-5xl overflow-hidden rounded-[var(--radius-card)] bg-mist">
            <SafeImage src={p.cover_image} alt={p.cover_alt || p.title} fill priority sizes="(min-width:1024px) 1024px, 100vw" className="object-cover" />
          </div>
        </div>
      ) : null}

      <div className="container-x grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="mx-auto w-full max-w-[72ch] lg:mx-0">
          {toc.length >= 3 ? (
            <details className="mb-10 rounded-[var(--radius-card)] bg-mist p-5 lg:hidden" open>
              <summary className="cursor-pointer font-semibold">Nội dung bài viết</summary>
              <ol className="mt-3 space-y-2 text-sm">
                {toc.map((t) => <li key={t.id} className={t.level === 3 ? "pl-4" : ""}><a href={`#${t.id}`} className="text-steel hover:text-brand">{t.text}</a></li>)}
              </ol>
            </details>
          ) : null}

          <Markdown content={p.content} />

          {p.source_note ? <p className="mt-10 border-t border-silver pt-5 text-sm text-steel">Nguồn tham khảo: {p.source_note}</p> : null}
          {p.tags.length ? (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Thẻ">
              {p.tags.map((t) => <li key={t} className="chip bg-mist text-steel">#{t}</li>)}
            </ul>
          ) : null}

          {p.vehicle ? (
            <aside className="mt-12 grid items-center gap-6 rounded-[var(--radius-card)] bg-ink p-6 text-white sm:grid-cols-[180px_1fr]">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-ink-2">
                <SafeImage src={p.vehicle.cover_image} alt={p.vehicle.name} fill sizes="180px" className="object-contain" dark placeholderLabel=" " />
              </div>
              <div>
                <p className="text-sm text-white/60">Mẫu xe được nhắc đến</p>
                <p className="mt-1 text-2xl font-bold tracking-[-0.02em]">{p.vehicle.name}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/xe/${p.vehicle.slug}`} className="btn btn-light btn-sm">Xem chi tiết xe</Link>
                  <Link href={`/xe/${p.vehicle.slug}#bao-gia`} className="btn btn-primary btn-sm">Nhận báo giá</Link>
                </div>
              </div>
            </aside>
          ) : null}
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-8">
            {toc.length >= 2 ? (
              <nav aria-label="Mục lục">
                <p className="text-sm font-semibold text-steel">Trong bài này</p>
                <ol className="mt-3 space-y-2.5 border-l border-silver text-sm">
                  {toc.map((t) => (
                    <li key={t.id} className={t.level === 3 ? "pl-7" : "pl-4"}>
                      <a href={`#${t.id}`} className="text-ink/70 hover:text-brand">{t.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}
            <div className="rounded-[var(--radius-card)] border border-silver p-5">
              <p className="font-bold">Cần tư vấn thêm?</p>
              <p className="mt-1 text-sm text-steel">Hỏi trực tiếp Nhật Thanh về mẫu xe, giá và trả góp.</p>
              <a href={tel} className="btn btn-primary btn-sm mt-4 w-full"><Phone className="size-4" aria-hidden /> {site.contact.hotline}</a>
            </div>
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="border-t border-silver" aria-labelledby="bai-lien-quan">
          <div className="container-x py-14 md:py-20">
            <h2 id="bai-lien-quan" className="h-section">Bài viết liên quan</h2>
            <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => <PostCard key={r.id} post={r} />)}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-ink py-16 text-white md:py-20" aria-labelledby="tu-van">
        <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 id="tu-van" className="h-section">Nhận tư vấn từ Nhật Thanh</h2>
            <p className="lede mt-4 !text-white/60">Để lại số điện thoại, Nhật Thanh sẽ gọi lại để giải đáp các câu hỏi của bạn.</p>
          </div>
          <LeadForm dark sourcePage={`/tin-tuc/${p.slug}`} defaultVehicleId={p.vehicle?.id} vehicles={vehicles.map((v) => ({ id: v.id, name: v.name }))} />
        </div>
      </section>
    </>
  );
}
