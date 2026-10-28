import Link from "next/link";
import { notFound } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Flash, PageHeader } from "@/components/admin/ui";
import { PostEditor } from "@/components/admin/PostEditor";
import type { Post, PostCategory } from "@/lib/posts";

export default async function PostEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const staff = await requireStaff();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const sb = await createSessionClient();
  const [{ data: cats }, { data: vehicles }] = await Promise.all([
    sb.from("post_categories").select("*").order("sort_order"),
    sb.from("vehicles").select("id, name, slug").is("deleted_at", null).order("sort_order"),
  ]);
  let post: Post | null = null;
  if (id !== "new") {
    const { data } = await sb.from("posts").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    post = data as Post;
  }
  return (
    <>
      <PageHeader title={post ? "Sửa bài viết" : "Viết bài mới"} actions={<Link href="/admin/posts" className="btn btn-ghost btn-sm">Danh sách bài viết</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      <PostEditor key={post?.updated_at ?? "new"} post={post} categories={(cats ?? []) as PostCategory[]} vehicles={vehicles ?? []} defaultAuthor={staff.full_name ?? "Nhật Thanh"} />
    </>
  );
}
