# Bản cập nhật: Tin tức và kiến thức

Giải nén **đè lên thư mục dự án hiện có** (giữ nguyên cấu trúc thư mục). Chỉ gồm file mới và file đã sửa.

## File mới
- `supabase/migrations/20261029000001_posts.sql` — bảng `post_categories`, `posts`, RLS, bucket `post-images`, 5 chuyên mục khởi tạo
- `src/lib/posts.ts` — kiểu dữ liệu, thời gian đọc, mục lục, kiểm tra SEO
- `src/lib/post-data.ts` — đọc bài viết cho trang public
- `src/components/news/Markdown.tsx`, `PostCard.tsx`, `NewsIndex.tsx`
- `src/app/(site)/tin-tuc/page.tsx` — `/tin-tuc`
- `src/app/(site)/tin-tuc/[slug]/page.tsx` — trang bài viết
- `src/app/(site)/tin-tuc/chuyen-muc/[slug]/page.tsx` — trang chuyên mục
- `src/app/(site)/tin-tuc/rss.xml/route.ts` — RSS
- `src/app/admin/_actions/posts.ts`
- `src/app/admin/(panel)/posts/page.tsx`, `posts/[id]/page.tsx`, `posts/categories/page.tsx`
- `src/components/admin/PostEditor.tsx`

## File đã sửa (thay thế file cũ)
- `package.json`, `package-lock.json` — thêm `react-markdown`, `remark-gfm`
- `src/components/site/HeaderNav.tsx` — menu “Tin tức”
- `src/components/site/Footer.tsx` — link “Tin tức và kiến thức”
- `src/components/admin/AdminNav.tsx` — mục “Tin tức” trong Admin
- `src/app/(site)/page.tsx` — section 3 bài mới nhất trên trang chủ
- `src/app/(site)/xe/[slug]/page.tsx` — khối “Bài viết về [tên xe]”
- `src/app/sitemap.ts` — thêm bài viết và chuyên mục

## Các bước cài đặt
1. Giải nén đè vào thư mục dự án.
2. `npm install`
3. Supabase → SQL Editor → chạy `supabase/migrations/20261029000001_posts.sql`.
4. `npm run build` để kiểm tra, sau đó commit và push lên GitHub; Vercel tự deploy.
Không cần thêm biến môi trường mới.
