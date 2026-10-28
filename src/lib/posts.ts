import { slugify } from "./format";

export interface PostCategory { id: string; name: string; slug: string; description: string | null; sort_order: number; is_active: boolean }

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  cover_alt: string | null;
  category_id: string | null;
  vehicle_id: string | null;
  tags: string[];
  focus_keyword: string | null;
  author_name: string | null;
  source_note: string | null;
  is_published: boolean;
  published_at: string | null;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  category?: Pick<PostCategory, "id" | "name" | "slug"> | null;
  vehicle?: { id: string; name: string; slug: string; cover_image: string | null } | null;
}

/** Bỏ cú pháp Markdown để đếm chữ / tạo mô tả */
export function markdownToText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>|~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordCount(md: string): number {
  const t = markdownToText(md);
  return t ? t.split(" ").length : 0;
}

/** Tiếng Việt đọc khoảng 200 từ/phút */
export function readingMinutes(md: string): number {
  return Math.max(1, Math.round(wordCount(md) / 200));
}

export interface TocItem { id: string; text: string; level: 2 | 3 }

/** Mục lục từ các tiêu đề ## và ### (bỏ qua trong khối code) */
export function extractToc(md: string): TocItem[] {
  const out: TocItem[] = [];
  let inCode = false;
  for (const line of md.split("\n")) {
    if (line.trim().startsWith("```")) inCode = !inCode;
    if (inCode) continue;
    const m = /^(##|###)\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) {
      const text = markdownToText(m[2]);
      out.push({ id: headingId(text), text, level: m[1].length === 2 ? 2 : 3 });
    }
  }
  return out;
}

export function headingId(text: string): string {
  return slugify(text).slice(0, 80) || "muc";
}

export function postDescription(p: Pick<Post, "seo_description" | "excerpt" | "content">): string {
  const raw = p.seo_description || p.excerpt || markdownToText(p.content);
  return raw.length > 165 ? raw.slice(0, 162).replace(/\s+\S*$/, "") + "…" : raw;
}

export function isLive(p: Pick<Post, "is_published" | "published_at" | "deleted_at">): boolean {
  return p.is_published && !p.deleted_at && !!p.published_at && new Date(p.published_at).getTime() <= Date.now();
}

/** Các kiểm tra SEO cơ bản cho trình soạn thảo */
export function seoChecks(input: { title: string; slug: string; seoTitle: string; seoDescription: string; excerpt: string; content: string; keyword: string; coverAlt: string; hasCover: boolean }) {
  const kw = input.keyword.trim().toLowerCase();
  const title = (input.seoTitle || input.title).trim();
  const desc = (input.seoDescription || input.excerpt).trim();
  const text = markdownToText(input.content).toLowerCase();
  const firstPara = text.slice(0, 400);
  const words = wordCount(input.content);
  const h2 = (input.content.match(/^##\s+/gm) ?? []).length;
  const imgs = input.content.match(/!\[([^\]]*)\]\(/g) ?? [];
  const imgsNoAlt = imgs.filter((m) => /!\[\s*\]\(/.test(m)).length;
  const links = (input.content.match(/\]\(\/(xe|tin-tuc|so-sanh|du-toan-chi-phi|uu-dai|lien-he)/g) ?? []).length;
  const kwSlug = kw ? slugify(kw) : "";
  return [
    { ok: !!kw, label: "Đã đặt từ khoá chính" },
    { ok: !!kw && title.toLowerCase().includes(kw), label: "Từ khoá có trong tiêu đề SEO" },
    { ok: !!kw && desc.toLowerCase().includes(kw), label: "Từ khoá có trong mô tả SEO / tóm tắt" },
    { ok: !!kw && firstPara.includes(kw), label: "Từ khoá xuất hiện ở đoạn mở đầu" },
    { ok: !!kwSlug && input.slug.includes(kwSlug), label: "Slug chứa từ khoá" },
    { ok: title.length >= 30 && title.length <= 65, label: `Tiêu đề SEO 30–65 ký tự (hiện ${title.length})` },
    { ok: desc.length >= 120 && desc.length <= 165, label: `Mô tả SEO 120–165 ký tự (hiện ${desc.length})` },
    { ok: words >= 600, label: `Nội dung từ 600 từ (hiện ${words})` },
    { ok: h2 >= 2, label: `Có ít nhất 2 tiêu đề mục ## (hiện ${h2})` },
    { ok: input.hasCover && !!input.coverAlt.trim(), label: "Có ảnh bìa và mô tả ảnh bìa" },
    { ok: imgsNoAlt === 0, label: imgs.length ? `Ảnh trong bài đều có mô tả (${imgs.length - imgsNoAlt}/${imgs.length})` : "Ảnh trong bài có mô tả" },
    { ok: links >= 1, label: "Có liên kết nội bộ tới trang xe / công cụ / bài khác" },
  ];
}
