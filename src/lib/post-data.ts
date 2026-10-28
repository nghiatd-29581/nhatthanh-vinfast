import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Post, PostCategory } from "@/lib/posts";

/*
 * Đọc bài viết cho trang public. RLS đã chặn bài nháp, bài hẹn giờ chưa tới và bài đã xoá;
 * các điều kiện lọc dưới đây lặp lại để rõ ràng và tận dụng index.
 */

const LIST_SELECT = "id, title, slug, excerpt, cover_image, cover_alt, category_id, vehicle_id, tags, author_name, published_at, updated_at, is_featured, is_published, deleted_at, content, category:post_categories(id, name, slug)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function live(q: any): any {
  return q.eq("is_published", true).is("deleted_at", null).not("published_at", "is", null).lte("published_at", new Date().toISOString());
}

export const getPostCategories = cache(async (): Promise<PostCategory[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await createPublicClient().from("post_categories").select("*").eq("is_active", true).order("sort_order");
    return (data ?? []) as PostCategory[];
  } catch {
    return [];
  }
});

export const getPosts = cache(async (opts: { categoryId?: string; page?: number; perPage?: number; vehicleId?: string; excludeId?: string } = {}): Promise<{ posts: Post[]; total: number }> => {
  if (!isSupabaseConfigured()) return { posts: [], total: 0 };
  const per = opts.perPage ?? 12;
  const page = Math.max(1, opts.page ?? 1);
  try {
    let q = live(createPublicClient().from("posts").select(LIST_SELECT, { count: "exact" }));
    if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
    if (opts.vehicleId) q = q.eq("vehicle_id", opts.vehicleId);
    if (opts.excludeId) q = q.neq("id", opts.excludeId);
    const { data, count, error } = await q.order("published_at", { ascending: false }).range((page - 1) * per, page * per - 1);
    if (error) throw error;
    return { posts: (data ?? []) as unknown as Post[], total: count ?? 0 };
  } catch {
    return { posts: [], total: 0 };
  }
});

export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await live(
      createPublicClient()
        .from("posts")
        .select("*, category:post_categories(id, name, slug), vehicle:vehicles(id, name, slug, cover_image)")
        .eq("slug", slug),
    ).maybeSingle();
    return (data as Post) ?? null;
  } catch {
    return null;
  }
});

/** Bài liên quan: cùng chuyên mục hoặc cùng tag, mới nhất trước */
export const getRelatedPosts = cache(async (post: Post, limit = 3): Promise<Post[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const sb = createPublicClient();
    const filters = [post.category_id ? `category_id.eq.${post.category_id}` : null, post.tags.length ? `tags.ov.{${post.tags.map((t) => `"${t.replace(/"/g, "")}"`).join(",")}}` : null].filter(Boolean);
    let q = live(sb.from("posts").select(LIST_SELECT)).neq("id", post.id);
    if (filters.length) q = q.or(filters.join(","));
    const { data } = await q.order("published_at", { ascending: false }).limit(limit);
    return (data ?? []) as unknown as Post[];
  } catch {
    return [];
  }
});

/** Dùng cho sitemap và RSS */
export const getAllPostsForIndex = cache(async (): Promise<Pick<Post, "slug" | "title" | "excerpt" | "published_at" | "updated_at" | "content" | "seo_description">[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await live(createPublicClient().from("posts").select("slug, title, excerpt, published_at, updated_at, content, seo_description"))
      .order("published_at", { ascending: false })
      .limit(1000);
    return (data ?? []) as Post[];
  } catch {
    return [];
  }
});
