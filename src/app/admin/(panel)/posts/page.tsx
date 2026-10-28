import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Flash, PageHeader, Pagination, Pill } from "@/components/admin/ui";
import { postQuickAction } from "@/app/admin/_actions/posts";
import { formatDate } from "@/lib/format";
import { wordCount, type Post } from "@/lib/posts";

const PER = 20;

function statusOf(p: Post): { label: string; tone: "green" | "amber" | "red" | "default" | "blue" } {
  if (p.deleted_at) return { label: "Đã xoá", tone: "red" };
  if (!p.is_published) return { label: "Nháp", tone: "default" };
  if (p.published_at && new Date(p.published_at).getTime() > Date.now()) return { label: "Hẹn giờ", tone: "blue" };
  return { label: "Đã đăng", tone: "green" };
}

export default async function PostsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireStaff();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const sb = await createSessionClient();
  const { data: cats } = await sb.from("post_categories").select("id, name").order("sort_order");

  let q = sb.from("posts").select("id, title, slug, content, is_published, published_at, deleted_at, is_featured, updated_at, focus_keyword, category:post_categories(name)", { count: "exact" });
  const nowIso = new Date().toISOString();
  if (sp.view === "trash") q = q.not("deleted_at", "is", null);
  else q = q.is("deleted_at", null);
  if (sp.view === "published") q = q.eq("is_published", true).lte("published_at", nowIso);
  if (sp.view === "scheduled") q = q.eq("is_published", true).gt("published_at", nowIso);
  if (sp.view === "draft") q = q.eq("is_published", false);
  if (sp.cat) q = q.eq("category_id", sp.cat);
  if (sp.q) q = q.ilike("title", `%${sp.q.replace(/[%_]/g, "")}%`);
  const { data, count } = await q.order("updated_at", { ascending: false }).range((page - 1) * PER, page * PER - 1);
  const posts = (data ?? []) as unknown as Post[];

  const qs = (p: number) => `/admin/posts?${new URLSearchParams(Object.entries({ ...sp, page: String(p), ok: "", error: "" }).filter(([, v]) => v) as [string, string][])}`;
  const back = qs(page);
  const act = (id: string, op: string, label: string, cls = "text-brand") => (
    <form action={postQuickAction}>
      <input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={op} /><input type="hidden" name="back" value={back} />
      <button className={`text-xs font-semibold hover:underline ${cls}`}>{label}</button>
    </form>
  );

  return (
    <>
      <PageHeader title="Tin tức" desc="Bài viết kiến thức giúp website xuất hiện với nhiều từ khoá tìm kiếm hơn."
        actions={<>
          <Link href="/admin/posts/categories" className="btn btn-ghost btn-sm">Chuyên mục</Link>
          <Link href="/admin/posts/new" className="btn btn-primary btn-sm">Viết bài mới</Link>
        </>} />
      <Flash ok={sp.ok} error={sp.error} />

      <form className="mb-4 grid gap-2 rounded-2xl border border-silver bg-white p-3 sm:grid-cols-[1fr_180px_200px_auto]">
        <input name="q" defaultValue={sp.q} placeholder="Tìm theo tiêu đề" className="field" aria-label="Tìm kiếm" />
        <select name="view" defaultValue={sp.view ?? ""} className="field" aria-label="Trạng thái">
          <option value="">Tất cả (trừ đã xoá)</option>
          <option value="published">Đã đăng</option>
          <option value="scheduled">Hẹn giờ</option>
          <option value="draft">Nháp</option>
          <option value="trash">Đã xoá</option>
        </select>
        <select name="cat" defaultValue={sp.cat ?? ""} className="field" aria-label="Chuyên mục">
          <option value="">Mọi chuyên mục</option>
          {cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn btn-primary btn-sm">Lọc</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-silver bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-mist text-steel">
            <tr><th className="p-3">Bài viết</th><th className="p-3">Chuyên mục</th><th className="p-3">Độ dài</th><th className="p-3">Trạng thái</th><th className="p-3">Ngày đăng</th><th className="p-3">Thao tác</th></tr>
          </thead>
          <tbody>
            {posts.map((p) => {
              const st = statusOf(p);
              const words = wordCount(p.content);
              const live = st.label === "Đã đăng";
              return (
                <tr key={p.id} className="border-t border-silver align-top">
                  <td className="p-3">
                    <Link href={`/admin/posts/${p.id}`} className="font-semibold hover:text-brand">{p.title}</Link>
                    <p className="text-xs text-steel">/tin-tuc/{p.slug}</p>
                    {p.focus_keyword ? <p className="mt-1 text-xs text-steel">Từ khoá: <b>{p.focus_keyword}</b></p> : <p className="mt-1 text-xs text-amber-700">Chưa đặt từ khoá chính</p>}
                  </td>
                  <td className="p-3">{p.category?.name ?? "—"}</td>
                  <td className="p-3 tabular-nums">{words.toLocaleString("vi-VN")} từ{words < 600 ? <p className="text-xs text-amber-700">Hơi ngắn</p> : null}</td>
                  <td className="p-3"><div className="flex flex-wrap gap-1"><Pill tone={st.tone}>{st.label}</Pill>{p.is_featured ? <Pill tone="blue">Nổi bật</Pill> : null}</div></td>
                  <td className="p-3 text-steel">{p.published_at ? formatDate(p.published_at, true) : "—"}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <Link href={`/admin/posts/${p.id}`} className="text-xs font-semibold text-brand hover:underline">Sửa</Link>
                      {live ? <Link href={`/tin-tuc/${p.slug}`} target="_blank" className="text-xs font-semibold text-brand hover:underline">Xem</Link> : null}
                      {p.deleted_at ? act(p.id, "restore", "Khôi phục") : <>
                        {p.is_published ? act(p.id, "unpublish", "Gỡ bài") : act(p.id, "publish", "Đăng ngay")}
                        {p.is_featured ? act(p.id, "unfeature", "Bỏ nổi bật") : act(p.id, "feature", "Nổi bật")}
                        {act(p.id, "delete", "Xoá", "text-signal")}
                      </>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!posts.length && <tr><td colSpan={6} className="p-8 text-center text-steel">Chưa có bài viết. Bấm “Viết bài mới” để bắt đầu.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={count ?? 0} perPage={PER} base={qs} />
    </>
  );
}
