"use client";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Bold, CheckCircle2, Circle, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Quote, Table2 } from "lucide-react";
import { savePost, type PostFormState } from "@/app/admin/_actions/posts";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Markdown } from "@/components/news/Markdown";
import { slugify } from "@/lib/format";
import { isoToLocal } from "@/lib/admin-format";
import { isLive, readingMinutes, seoChecks, wordCount, type Post, type PostCategory } from "@/lib/posts";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX = 8 * 1024 * 1024;

async function uploadImage(file: File): Promise<string> {
  if (!ACCEPT.includes(file.type)) throw new Error("Chỉ nhận ảnh JPG, PNG, WebP, AVIF.");
  if (file.size > MAX) throw new Error("Ảnh vượt quá 8MB.");
  const sb = createBrowserSupabase();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from("post-images").upload(path, file, { cacheControl: "31536000", contentType: file.type });
  if (error) throw new Error("Không tải được ảnh lên. Kiểm tra quyền Storage.");
  return sb.storage.from("post-images").getPublicUrl(path).data.publicUrl;
}

function Counter({ value, min, max }: { value: string; min: number; max: number }) {
  const n = value.length;
  const ok = n >= min && n <= max;
  return <span className={`text-xs tabular-nums ${n === 0 ? "text-steel" : ok ? "text-emerald-700" : "text-amber-700"}`}>{n}/{max}</span>;
}

export function PostEditor({ post, categories, vehicles, defaultAuthor }: {
  post: Post | null; categories: PostCategory[]; vehicles: { id: string; name: string; slug: string }[]; defaultAuthor: string;
}) {
  const [state, action, pending] = useActionState<PostFormState, FormData>(savePost, {});
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [cover, setCover] = useState(post?.cover_image ?? "");
  const [coverAlt, setCoverAlt] = useState(post?.cover_alt ?? "");
  const [keyword, setKeyword] = useState(post?.focus_keyword ?? "");
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? "");
  const [seoDesc, setSeoDesc] = useState(post?.seo_description ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState<"" | "cover" | "inline">("");
  const [uploadError, setUploadError] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);

  const effectiveSlug = slugTouched ? slug : slugify(title).slice(0, 120);
  const checks = useMemo(
    () => seoChecks({ title, slug: effectiveSlug, seoTitle, seoDescription: seoDesc, excerpt, content, keyword, coverAlt, hasCover: !!cover }),
    [title, effectiveSlug, seoTitle, seoDesc, excerpt, content, keyword, coverAlt, cover],
  );
  const score = checks.filter((c) => c.ok).length;
  const [siteHost, setSiteHost] = useState("");
  useEffect(() => setSiteHost(window.location.host), []);

  /** Chèn / bọc văn bản tại vị trí con trỏ */
  function insert(before: string, after = "", placeholder = "") {
    const el = ta.current;
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = content.slice(s, e) || placeholder;
    const next = content.slice(0, s) + before + sel + after + content.slice(e);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  }
  function linePrefix(prefix: string, placeholder: string) {
    const el = ta.current;
    if (!el) return;
    const s = el.selectionStart;
    const lineStart = content.lastIndexOf("\n", s - 1) + 1;
    const sel = content.slice(el.selectionStart, el.selectionEnd);
    if (sel) {
      const lines = sel.split("\n").map((l, i) => (prefix === "1. " ? `${i + 1}. ` : prefix) + l).join("\n");
      setContent(content.slice(0, el.selectionStart) + lines + content.slice(el.selectionEnd));
    } else {
      setContent(content.slice(0, lineStart) + prefix + (content.slice(lineStart) || placeholder));
    }
    requestAnimationFrame(() => el.focus());
  }

  async function onInlineImage(file?: File) {
    if (!file) return;
    setUploading("inline"); setUploadError("");
    try {
      const url = await uploadImage(file);
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      insert(`\n\n![${alt}](${url})\n\n`);
    } catch (e) { setUploadError((e as Error).message); }
    setUploading("");
  }
  async function onCover(file?: File) {
    if (!file) return;
    setUploading("cover"); setUploadError("");
    try { setCover(await uploadImage(file)); } catch (e) { setUploadError((e as Error).message); }
    setUploading("");
  }

  const tool = "inline-flex size-9 items-center justify-center rounded-lg text-ink/70 hover:bg-mist hover:text-ink";

  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}
      {post ? <input type="hidden" name="prev_slug" value={post.slug} /> : null}
      <input type="hidden" name="slug" value={effectiveSlug} />
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="cover_image" value={cover} />

      <div className="grid content-start gap-5">
        {state.error ? <p role="alert" className="rounded-xl bg-signal/10 px-4 py-3 text-sm font-medium text-signal">{state.error}</p> : null}
        {uploadError ? <p role="alert" className="rounded-xl bg-signal/10 px-4 py-3 text-sm font-medium text-signal">{uploadError}</p> : null}

        <section className="rounded-2xl border border-silver bg-white p-5">
          <label className="block">
            <span className="label">Tiêu đề bài viết *</span>
            <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={5} maxLength={200}
              className="field !text-xl font-bold" placeholder="Ví dụ: Sạc ô tô điện tại nhà cần chuẩn bị những gì?" />
          </label>
          <label className="mt-4 block">
            <span className="label">Đường dẫn (slug)</span>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm text-steel">/tin-tuc/</span>
              <input value={effectiveSlug} onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} className="field" aria-label="Slug" />
            </div>
            <span className="mt-1 block text-xs text-steel">Tự tạo từ tiêu đề. Ngắn gọn, chứa từ khoá chính. Hạn chế đổi sau khi đã đăng.</span>
          </label>
          <label className="mt-4 block">
            <span className="label flex justify-between"><span>Tóm tắt (sapo)</span><Counter value={excerpt} min={120} max={300} /></span>
            <textarea name="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} maxLength={400} className="field"
              placeholder="1–2 câu tóm tắt bài viết, hiện ở danh sách tin và dưới tiêu đề." />
          </label>
        </section>

        <section className="rounded-2xl border border-silver bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-silver p-2">
            <div className="flex flex-wrap items-center gap-0.5" role="toolbar" aria-label="Định dạng">
              <button type="button" className={tool} title="Tiêu đề mục (H2)" onClick={() => linePrefix("## ", "Tiêu đề mục")}><Heading2 className="size-4.5" /></button>
              <button type="button" className={tool} title="Tiêu đề nhỏ (H3)" onClick={() => linePrefix("### ", "Tiêu đề nhỏ")}><Heading3 className="size-4.5" /></button>
              <button type="button" className={tool} title="In đậm" onClick={() => insert("**", "**", "chữ đậm")}><Bold className="size-4.5" /></button>
              <button type="button" className={tool} title="In nghiêng" onClick={() => insert("*", "*", "chữ nghiêng")}><Italic className="size-4.5" /></button>
              <button type="button" className={tool} title="Danh sách" onClick={() => linePrefix("- ", "Ý thứ nhất")}><List className="size-4.5" /></button>
              <button type="button" className={tool} title="Danh sách đánh số" onClick={() => linePrefix("1. ", "Bước thứ nhất")}><ListOrdered className="size-4.5" /></button>
              <button type="button" className={tool} title="Trích dẫn / lưu ý" onClick={() => linePrefix("> ", "Lưu ý quan trọng")}><Quote className="size-4.5" /></button>
              <button type="button" className={tool} title="Liên kết" onClick={() => insert("[", "](https://)", "chữ hiển thị")}><Link2 className="size-4.5" /></button>
              <button type="button" className={tool} title="Bảng" onClick={() => insert("\n\n| Tiêu chí | Lựa chọn A | Lựa chọn B |\n|---|---|---|\n| … | … | … |\n\n")}><Table2 className="size-4.5" /></button>
              <label className={`${tool} cursor-pointer`} title="Chèn ảnh vào bài">
                {uploading === "inline" ? <Loader2 className="size-4.5 animate-spin" /> : <ImagePlus className="size-4.5" />}
                <input type="file" accept={ACCEPT.join(",")} className="sr-only" onChange={(e) => { onInlineImage(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
              <select className="ml-1 h-9 rounded-lg border border-silver px-2 text-sm" value="" aria-label="Chèn liên kết nội bộ"
                onChange={(e) => { if (e.target.value) insert(e.target.value); e.target.value = ""; }}>
                <option value="">+ Liên kết nội bộ</option>
                {vehicles.map((v) => <option key={v.id} value={`[${v.name}](/xe/${v.slug})`}>Trang xe: {v.name}</option>)}
                <option value="[công cụ dự toán trả góp](/du-toan-chi-phi)">Công cụ dự toán chi phí</option>
                <option value="[so sánh các mẫu xe](/so-sanh)">Trang so sánh xe</option>
                <option value="[chương trình ưu đãi](/uu-dai)">Trang ưu đãi</option>
                <option value="[đăng ký lái thử](/lien-he?nhu-cau=test_drive#dang-ky)">Đăng ký lái thử</option>
              </select>
            </div>
            <div className="inline-flex rounded-full bg-mist p-1" role="tablist">
              {(["write", "preview"] as const).map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${tab === t ? "bg-white shadow-sm" : "text-steel"}`}>{t === "write" ? "Viết" : "Xem trước"}</button>
              ))}
            </div>
          </div>
          {tab === "write" ? (
            <textarea ref={ta} value={content} onChange={(e) => setContent(e.target.value)} rows={28} spellCheck
              className="block w-full resize-y rounded-b-2xl p-5 font-mono text-[14px] leading-relaxed outline-none"
              placeholder={"Mở đầu: nêu vấn đề người đọc quan tâm và nhắc từ khoá chính.\n\n## Tiêu đề mục thứ nhất\n\nNội dung…\n\n## Tiêu đề mục thứ hai\n\n- Ý 1\n- Ý 2\n\n> Lưu ý: …"} />
          ) : (
            <div className="min-h-[400px] p-6 md:p-10">{content.trim() ? <Markdown content={content} /> : <p className="text-steel">Chưa có nội dung.</p>}</div>
          )}
          <p className="border-t border-silver px-5 py-2 text-xs text-steel">
            {wordCount(content).toLocaleString("vi-VN")} từ • khoảng {readingMinutes(content)} phút đọc • Cú pháp Markdown: ## tiêu đề, **đậm**, - danh sách, [chữ](link)
          </p>
        </section>
      </div>

      {/* Cột phải */}
      <div className="grid content-start gap-5">
        <section className="rounded-2xl border border-silver bg-white p-5">
          <h2 className="font-bold">Đăng bài</h2>
          {post ? (
            <p className="mt-1 text-sm text-steel">
              Trạng thái: <b>{post.deleted_at ? "Đã xoá" : !post.is_published ? "Nháp" : isLive(post) ? "Đã đăng" : "Hẹn giờ"}</b>
              {isLive(post) ? <> • <Link href={`/tin-tuc/${post.slug}`} target="_blank" className="text-brand underline">Xem bài</Link></> : null}
            </p>
          ) : null}
          <label className="mt-4 block">
            <span className="label">Thời gian đăng (giờ Việt Nam)</span>
            <input type="datetime-local" name="published_at" defaultValue={isoToLocal(post?.published_at)} className="field" />
            <span className="mt-1 block text-xs text-steel">Để trống = đăng ngay khi bấm Xuất bản. Chọn thời điểm tương lai để hẹn giờ.</span>
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" name="is_featured" defaultChecked={post?.is_featured} className="size-4" /> Bài nổi bật</label>
          <div className="mt-5 flex flex-wrap gap-2">
            <button name="intent" value="draft" className="btn btn-ghost btn-sm" disabled={pending}>Lưu nháp</button>
            <button name="intent" value="publish" className="btn btn-primary btn-sm" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}{post?.is_published ? "Cập nhật bài đã đăng" : "Xuất bản"}
            </button>
          </div>
          {post?.is_published ? <p className="mt-2 text-xs text-steel">Bấm “Lưu nháp” sẽ gỡ bài khỏi website.</p> : null}
        </section>

        <section className="rounded-2xl border border-silver bg-white p-5">
          <h2 className="font-bold">Phân loại</h2>
          <label className="mt-3 block"><span className="label">Chuyên mục</span>
            <select name="category_id" defaultValue={post?.category_id ?? ""} className="field">
              <option value="">Chưa phân loại</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="mt-3 block"><span className="label">Mẫu xe liên quan</span>
            <select name="vehicle_id" defaultValue={post?.vehicle_id ?? ""} className="field">
              <option value="">Không gắn xe</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <span className="mt-1 block text-xs text-steel">Bài sẽ hiện ở trang chi tiết xe và có khung “Nhận báo giá”.</span>
          </label>
          <label className="mt-3 block"><span className="label">Thẻ (tag)</span>
            <input name="tags" defaultValue={post?.tags.join(", ")} className="field" placeholder="sạc tại nhà, pin xe điện" />
            <span className="mt-1 block text-xs text-steel">Phân tách bằng dấu phẩy, tối đa 12 thẻ.</span>
          </label>
          <label className="mt-3 block"><span className="label">Tác giả</span>
            <input name="author_name" defaultValue={post?.author_name ?? defaultAuthor} className="field" />
          </label>
          <label className="mt-3 block"><span className="label">Nguồn tham khảo</span>
            <input name="source_note" defaultValue={post?.source_note ?? ""} className="field" placeholder="Tên tài liệu, website, ngày truy cập" />
          </label>
        </section>

        <section className="rounded-2xl border border-silver bg-white p-5">
          <h2 className="font-bold">Ảnh bìa</h2>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={coverAlt} className="mt-3 aspect-[16/9] w-full rounded-xl bg-mist object-cover" />
          ) : null}
          <label className="btn btn-ghost btn-sm mt-3 w-full cursor-pointer">
            {uploading === "cover" ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} {cover ? "Đổi ảnh bìa" : "Tải ảnh bìa lên"}
            <input type="file" accept={ACCEPT.join(",")} className="sr-only" onChange={(e) => { onCover(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          <label className="mt-3 block"><span className="label">Hoặc dán URL ảnh</span>
            <input value={cover} onChange={(e) => setCover(e.target.value.trim())} type="url" className="field" placeholder="https://…" />
          </label>
          <label className="mt-3 block"><span className="label">Mô tả ảnh bìa (alt)</span>
            <input name="cover_alt" value={coverAlt} onChange={(e) => setCoverAlt(e.target.value)} className="field" />
          </label>
          <p className="mt-2 text-xs text-steel">Tỉ lệ 16:9, rộng từ 1200px. Ảnh này cũng hiện khi chia sẻ link lên Facebook, Zalo.</p>
        </section>

        <section className="rounded-2xl border border-silver bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">SEO</h2>
            <span className={`chip ${score >= 10 ? "bg-emerald-100 text-emerald-800" : score >= 7 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700"}`}>{score}/{checks.length}</span>
          </div>
          <label className="mt-3 block"><span className="label">Từ khoá chính</span>
            <input name="focus_keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="field" placeholder="vd: sạc xe điện tại nhà" />
          </label>
          <label className="mt-3 block"><span className="label flex justify-between"><span>Tiêu đề SEO</span><Counter value={seoTitle || title} min={30} max={65} /></span>
            <input name="seo_title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={100} className="field" placeholder="Để trống = dùng tiêu đề bài" />
          </label>
          <label className="mt-3 block"><span className="label flex justify-between"><span>Mô tả SEO</span><Counter value={seoDesc || excerpt} min={120} max={165} /></span>
            <textarea name="seo_description" value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={3} maxLength={300} className="field" placeholder="Để trống = dùng tóm tắt" />
          </label>

          <div className="mt-4 rounded-xl border border-silver p-3" aria-label="Xem trước kết quả Google">
            <p className="truncate text-xs text-steel">{siteHost} › tin-tuc › {effectiveSlug || "…"}</p>
            <p className="mt-0.5 line-clamp-1 text-[17px] text-[#1a0dab]">{(seoTitle || title || "Tiêu đề bài viết").slice(0, 65)}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-steel">{(seoDesc || excerpt || "Mô tả bài viết sẽ hiện ở đây.").slice(0, 165)}</p>
          </div>

          <ul className="mt-4 space-y-1.5 text-sm">
            {checks.map((c) => (
              <li key={c.label} className="flex gap-2">
                {c.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 size-4 shrink-0 text-steel/50" />}
                <span className={c.ok ? "" : "text-steel"}>{c.label}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </form>
  );
}
