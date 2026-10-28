"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertStaff } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { localToIso, str } from "@/lib/admin-format";

const RESERVED = ["chuyen-muc", "rss-xml"];

function revalidateNews(slug?: string | null) {
  revalidatePath("/", "layout"); // trang chủ, sitemap, trang xe có khối bài viết
  revalidatePath("/tin-tuc");
  if (slug) revalidatePath(`/tin-tuc/${slug}`);
}

export interface PostFormState { error?: string }

export async function savePost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const { supabase, staff } = await assertStaff();
  const id = str(formData.get("id"));
  const title = str(formData.get("title"));
  if (!title || title.length < 5) return { error: "Tiêu đề cần ít nhất 5 ký tự." };
  const slug = slugify(str(formData.get("slug")) ?? title).slice(0, 120);
  if (!slug || RESERVED.includes(slug)) return { error: "Slug không hợp lệ, hãy đặt slug khác." };
  const content = String(formData.get("content") ?? "");
  if (content.length > 200_000) return { error: "Nội dung quá dài (tối đa 200.000 ký tự)." };

  const intent = String(formData.get("intent") ?? "draft");
  const publish = intent === "publish";
  let publishedAt = localToIso(formData.get("published_at"));
  if (publish && !publishedAt) publishedAt = new Date().toISOString();
  if (publish && !content.trim()) return { error: "Bài viết chưa có nội dung." };

  const coverImage = str(formData.get("cover_image"));
  if (coverImage && !/^https:\/\//.test(coverImage)) return { error: "URL ảnh bìa phải bắt đầu bằng https://" };

  const payload = {
    title,
    slug,
    excerpt: str(formData.get("excerpt"))?.slice(0, 400) ?? null,
    content,
    cover_image: coverImage,
    cover_alt: str(formData.get("cover_alt"))?.slice(0, 200) ?? null,
    category_id: str(formData.get("category_id")),
    vehicle_id: str(formData.get("vehicle_id")),
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .filter((t, i, a) => a.indexOf(t) === i)
      .slice(0, 12),
    focus_keyword: str(formData.get("focus_keyword"))?.slice(0, 100) ?? null,
    author_name: str(formData.get("author_name")) ?? staff.full_name ?? null,
    source_note: str(formData.get("source_note"))?.slice(0, 500) ?? null,
    is_featured: formData.get("is_featured") === "on",
    seo_title: str(formData.get("seo_title"))?.slice(0, 100) ?? null,
    seo_description: str(formData.get("seo_description"))?.slice(0, 300) ?? null,
    is_published: publish,
    published_at: publishedAt,
  };

  const { data, error } = id
    ? await supabase.from("posts").update(payload).eq("id", id).select("id").single()
    : await supabase.from("posts").insert(payload).select("id").single();
  if (error || !data) {
    return { error: error?.code === "23505" ? "Slug đã được dùng cho bài khác, hãy đổi slug." : "Không lưu được bài viết. Vui lòng thử lại." };
  }

  // nếu đổi slug, làm mới cả đường dẫn cũ
  const prevSlug = str(formData.get("prev_slug"));
  revalidateNews(slug);
  if (prevSlug && prevSlug !== slug) revalidatePath(`/tin-tuc/${prevSlug}`);

  const future = publish && publishedAt && new Date(publishedAt).getTime() > Date.now();
  const msg = !publish ? "Đã lưu nháp" : future ? "Đã hẹn giờ đăng bài" : "Đã xuất bản bài viết";
  redirect(`/admin/posts/${data.id}?ok=${encodeURIComponent(msg)}`);
}

export async function postQuickAction(formData: FormData) {
  const { supabase } = await assertStaff();
  const id = String(formData.get("id"));
  const op = String(formData.get("op"));
  const back = String(formData.get("back") ?? "/admin/posts");
  const patches: Record<string, Record<string, unknown>> = {
    unpublish: { is_published: false },
    feature: { is_featured: true },
    unfeature: { is_featured: false },
    delete: { deleted_at: new Date().toISOString(), is_published: false },
    restore: { deleted_at: null },
  };
  if (op === "publish") {
    const { data } = await supabase.from("posts").select("published_at").eq("id", id).single();
    await supabase.from("posts").update({ is_published: true, published_at: data?.published_at ?? new Date().toISOString() }).eq("id", id);
  } else if (patches[op]) {
    await supabase.from("posts").update(patches[op]).eq("id", id);
  }
  const { data: p } = await supabase.from("posts").select("slug").eq("id", id).single();
  revalidateNews(p?.slug);
  redirect(back);
}

export async function saveCategory(formData: FormData) {
  const { supabase } = await assertStaff();
  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  if (!name) redirect("/admin/posts/categories?error=" + encodeURIComponent("Vui lòng nhập tên chuyên mục"));
  const payload = {
    name,
    slug: slugify(str(formData.get("slug")) ?? name!),
    description: str(formData.get("description")),
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    is_active: formData.get("is_active") === "on",
  };
  const { error } = id
    ? await supabase.from("post_categories").update(payload).eq("id", id)
    : await supabase.from("post_categories").insert(payload);
  revalidateNews();
  redirect(`/admin/posts/categories?${error ? "error=" + encodeURIComponent(error.code === "23505" ? "Slug chuyên mục đã tồn tại" : "Không lưu được") : "ok=" + encodeURIComponent("Đã lưu chuyên mục")}`);
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await assertStaff();
  await supabase.from("post_categories").delete().eq("id", String(formData.get("id")));
  revalidateNews();
  redirect("/admin/posts/categories?ok=" + encodeURIComponent("Đã xoá chuyên mục. Các bài thuộc chuyên mục này chuyển về 'Chưa phân loại'."));
}
