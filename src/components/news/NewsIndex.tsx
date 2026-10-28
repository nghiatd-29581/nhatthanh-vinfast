import Link from "next/link";
import { PostCard } from "./PostCard";
import type { Post, PostCategory } from "@/lib/posts";

export function NewsIndex({ posts, total, page, perPage, categories, activeSlug, basePath }: {
  posts: Post[]; total: number; page: number; perPage: number; categories: PostCategory[]; activeSlug?: string; basePath: string;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const [lead, ...rest] = posts;
  const pill = (active: boolean) => `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active ? "bg-ink text-white" : "bg-mist text-ink hover:bg-silver"}`;
  const pageHref = (p: number) => (p === 1 ? basePath : `${basePath}?trang=${p}`);

  return (
    <section className="container-x py-12 md:py-16">
      {categories.length ? (
        <nav className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0" aria-label="Chuyên mục">
          <Link href="/tin-tuc" className={pill(!activeSlug)} aria-current={!activeSlug ? "page" : undefined}>Tất cả</Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/tin-tuc/chuyen-muc/${c.slug}`} className={pill(activeSlug === c.slug)} aria-current={activeSlug === c.slug ? "page" : undefined}>{c.name}</Link>
          ))}
        </nav>
      ) : null}

      {!posts.length ? (
        <div className="mt-10 rounded-[var(--radius-card)] bg-mist p-10 text-center">
          <p className="text-lg font-semibold">Chưa có bài viết trong mục này.</p>
          <p className="mt-1 text-steel">Bài viết mới sẽ được cập nhật thường xuyên. Bạn cần tư vấn ngay? Gọi 0349.63.65.67.</p>
        </div>
      ) : (
        <>
          {page === 1 && lead ? (
            <div className="mt-10 border-b border-silver pb-12"><PostCard post={lead} large priority /></div>
          ) : null}
          <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {(page === 1 ? rest : posts).map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </>
      )}

      {pages > 1 ? (
        <nav className="mt-14 flex items-center justify-between border-t border-silver pt-6 text-sm" aria-label="Phân trang">
          {page > 1 ? <Link className="btn btn-ghost btn-sm" href={pageHref(page - 1)} rel="prev">Bài mới hơn</Link> : <span />}
          <span className="text-steel">Trang {page}/{pages}</span>
          {page < pages ? <Link className="btn btn-ghost btn-sm" href={pageHref(page + 1)} rel="next">Bài cũ hơn</Link> : <span />}
        </nav>
      ) : null}
    </section>
  );
}
