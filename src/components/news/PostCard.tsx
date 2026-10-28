import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatDate } from "@/lib/format";
import { readingMinutes, type Post } from "@/lib/posts";

export function PostCard({ post, large = false, priority = false }: { post: Post; large?: boolean; priority?: boolean }) {
  return (
    <article className={`group flex flex-col ${large ? "md:grid md:grid-cols-[1.25fr_1fr] md:items-center md:gap-10" : ""}`}>
      <Link href={`/tin-tuc/${post.slug}`} className={`relative block overflow-hidden rounded-[var(--radius-card)] bg-mist ${large ? "aspect-[16/10]" : "aspect-[16/10]"}`} tabIndex={-1} aria-hidden>
        <SafeImage
          src={post.cover_image}
          alt={post.cover_alt || post.title}
          fill
          priority={priority}
          sizes={large ? "(min-width:768px) 55vw, 100vw" : "(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"}
          className="object-cover transition-transform duration-700 [transition-timing-function:var(--ease-drive)] group-hover:scale-[1.03]"
          placeholderLabel="Chưa có ảnh bìa"
        />
      </Link>
      <div className={large ? "mt-5 md:mt-0" : "mt-4"}>
        <p className="text-sm text-steel">
          {post.category ? (
            <Link href={`/tin-tuc/chuyen-muc/${post.category.slug}`} className="font-semibold text-brand hover:underline">{post.category.name}</Link>
          ) : null}
          {post.category ? <span className="mx-2 text-silver">/</span> : null}
          <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time>
          <span className="mx-2 text-silver">/</span>
          {readingMinutes(post.content)} phút đọc
        </p>
        <h3 className={`mt-2 font-bold tracking-[-0.02em] ${large ? "text-[clamp(1.6rem,1.1rem+1.6vw,2.4rem)] leading-[1.1]" : "text-xl leading-snug"}`}>
          <Link href={`/tin-tuc/${post.slug}`} className="hover:text-brand">{post.title}</Link>
        </h3>
        {post.excerpt ? <p className={`mt-2 text-steel ${large ? "text-lg" : "line-clamp-3"}`}>{post.excerpt}</p> : null}
      </div>
    </article>
  );
}
