import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Card, Field, Flash, PageHeader } from "@/components/admin/ui";
import { deleteCategory, saveCategory } from "@/app/admin/_actions/posts";
import type { PostCategory } from "@/lib/posts";

export default async function PostCategories({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const sb = await createSessionClient();
  const [{ data }, { data: counts }] = await Promise.all([
    sb.from("post_categories").select("*").order("sort_order"),
    sb.from("posts").select("category_id").is("deleted_at", null),
  ]);
  const cats = (data ?? []) as PostCategory[];
  const n = (id: string) => (counts ?? []).filter((c) => c.category_id === id).length;

  const form = (c: PostCategory | null) => (
    <form action={saveCategory} className="grid gap-3 sm:grid-cols-[1fr_1fr_90px]">
      {c ? <input type="hidden" name="id" value={c.id} /> : null}
      <Field label="Tên chuyên mục *"><input name="name" required defaultValue={c?.name} className="field" /></Field>
      <Field label="Slug" hint="Để trống sẽ tự tạo"><input name="slug" defaultValue={c?.slug} className="field" /></Field>
      <Field label="Thứ tự"><input name="sort_order" type="number" defaultValue={c?.sort_order ?? cats.length + 1} className="field" /></Field>
      <Field label="Mô tả (hiện đầu trang chuyên mục, dùng cho SEO)" className="sm:col-span-3"><input name="description" defaultValue={c?.description ?? ""} className="field" maxLength={200} /></Field>
      <div className="flex items-center justify-between gap-3 sm:col-span-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={c?.is_active ?? true} className="size-4" /> Hiển thị</label>
        <button className="btn btn-primary btn-sm">{c ? "Lưu" : "Thêm chuyên mục"}</button>
      </div>
    </form>
  );

  return (
    <>
      <PageHeader title="Chuyên mục tin tức" actions={<Link href="/admin/posts" className="btn btn-ghost btn-sm">Danh sách bài viết</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid max-w-4xl gap-5">
        {cats.map((c) => (
          <Card key={c.id} title={`${c.name} (${n(c.id)} bài)`} actions={
            <form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><button className="text-sm font-semibold text-signal">Xoá</button></form>
          }>{form(c)}</Card>
        ))}
        <Card title="Thêm chuyên mục">{form(null)}</Card>
      </div>
    </>
  );
}
