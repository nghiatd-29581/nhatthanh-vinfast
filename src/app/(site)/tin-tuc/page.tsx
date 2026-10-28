import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { NewsIndex } from "@/components/news/NewsIndex";
import { getPostCategories, getPosts } from "@/lib/post-data";

export const revalidate = 60;
const PER = 13; // 1 bài lớn + 12 bài lưới

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ trang?: string }> }): Promise<Metadata> {
  const page = Math.max(1, Number((await searchParams).trang ?? 1) || 1);
  return {
    title: page > 1 ? `Tin tức và kiến thức ô tô điện — trang ${page}` : "Tin tức và kiến thức ô tô điện VinFast",
    description: "Kiến thức xe điện, sạc và pin, kinh nghiệm chọn xe, tài chính mua xe và tin VinFast do Nhật Thanh biên soạn.",
    alternates: { canonical: page > 1 ? `/tin-tuc?trang=${page}` : "/tin-tuc", types: { "application/rss+xml": "/tin-tuc/rss.xml" } },
  };
}

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ trang?: string }> }) {
  const page = Math.max(1, Number((await searchParams).trang ?? 1) || 1);
  const [{ posts, total }, categories] = await Promise.all([getPosts({ page, perPage: PER }), getPostCategories()]);
  return (
    <>
      <PageIntro title="Tin tức và kiến thức" lede="Hiểu rõ ô tô điện trước khi mua: cách sạc, chăm sóc pin, chi phí sử dụng, kinh nghiệm chọn xe và tin tức mới." />
      <NewsIndex posts={posts} total={total} page={page} perPage={PER} categories={categories} basePath="/tin-tuc" />
    </>
  );
}
