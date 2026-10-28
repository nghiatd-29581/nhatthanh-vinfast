import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/site/PageIntro";
import { NewsIndex } from "@/components/news/NewsIndex";
import { getPostCategories, getPosts } from "@/lib/post-data";

export const revalidate = 60;
const PER = 13;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ trang?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const cat = (await getPostCategories()).find((c) => c.slug === slug);
  if (!cat) return { title: "Không tìm thấy chuyên mục" };
  const page = Math.max(1, Number(sp.trang ?? 1) || 1);
  const base = `/tin-tuc/chuyen-muc/${cat.slug}`;
  return {
    title: page > 1 ? `${cat.name} — trang ${page}` : cat.name,
    description: cat.description ?? `Bài viết chuyên mục ${cat.name} từ Nhật Thanh VinFast.`,
    alternates: { canonical: page > 1 ? `${base}?trang=${page}` : base },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const categories = await getPostCategories();
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();
  const page = Math.max(1, Number(sp.trang ?? 1) || 1);
  const { posts, total } = await getPosts({ categoryId: cat.id, page, perPage: PER });
  return (
    <>
      <PageIntro title={cat.name} lede={cat.description ?? undefined} />
      <NewsIndex posts={posts} total={total} page={page} perPage={PER} categories={categories} activeSlug={cat.slug} basePath={`/tin-tuc/chuyen-muc/${cat.slug}`} />
    </>
  );
}
