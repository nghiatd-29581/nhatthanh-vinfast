-- =====================================================================
-- Tin tức / bài viết kiến thức — bổ sung cho Nhật Thanh VinFast
-- Chạy SAU migration 20261028000001_init.sql
-- =====================================================================

create table if not exists public.post_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 5 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and slug <> 'chuyen-muc' and slug <> 'rss-xml'),
  excerpt text,                           -- tóm tắt 1–2 câu, hiện ở danh sách
  content text not null default '',       -- nội dung Markdown
  cover_image text,
  cover_alt text,
  category_id uuid references public.post_categories(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,  -- xe liên quan (liên kết nội bộ)
  tags text[] not null default '{}',
  focus_keyword text,                     -- từ khoá chính để kiểm tra SEO
  author_name text,
  source_note text,                       -- nguồn tham khảo (hiển thị cuối bài nếu có)
  is_published boolean not null default false,
  published_at timestamptz,               -- thời điểm đăng; ở tương lai = hẹn giờ
  is_featured boolean not null default false,
  seo_title text,
  seo_description text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_public_idx on public.posts (is_published, deleted_at, published_at desc);
create index if not exists posts_category_idx on public.posts (category_id);
create index if not exists posts_vehicle_idx on public.posts (vehicle_id);
create index if not exists posts_tags_idx on public.posts using gin (tags);

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at before update on public.posts for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.post_categories enable row level security;
alter table public.posts enable row level security;

drop policy if exists "post categories public read" on public.post_categories;
create policy "post categories public read" on public.post_categories for select using (is_active or public.is_staff());
drop policy if exists "post categories staff write" on public.post_categories;
create policy "post categories staff write" on public.post_categories for all using (public.is_staff()) with check (public.is_staff());

-- Public chỉ đọc bài đã xuất bản, đã tới giờ đăng, chưa xoá
drop policy if exists "posts public read" on public.posts;
create policy "posts public read" on public.posts for select using (
  (is_published and deleted_at is null and published_at is not null and published_at <= now()) or public.is_staff());
drop policy if exists "posts staff write" on public.posts;
create policy "posts staff write" on public.posts for all using (public.is_staff()) with check (public.is_staff());

-- ---------- Storage: ảnh bài viết ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

drop policy if exists "post images public read" on storage.objects;
create policy "post images public read" on storage.objects for select using (bucket_id = 'post-images');
drop policy if exists "post images staff insert" on storage.objects;
create policy "post images staff insert" on storage.objects for insert with check (bucket_id = 'post-images' and public.is_staff());
drop policy if exists "post images staff update" on storage.objects;
create policy "post images staff update" on storage.objects for update using (bucket_id = 'post-images' and public.is_staff());
drop policy if exists "post images staff delete" on storage.objects;
create policy "post images staff delete" on storage.objects for delete using (bucket_id = 'post-images' and public.is_staff());

-- ---------- Chuyên mục khởi tạo (có thể đổi tên/xoá trong Admin) ----------
insert into public.post_categories (name, slug, description, sort_order) values
  ('Kiến thức xe điện', 'kien-thuc-xe-dien', 'Hiểu đúng về ô tô điện: pin, động cơ, quãng đường, bảo dưỡng.', 1),
  ('Sạc và pin', 'sac-va-pin', 'Cách sạc, trạm sạc, chăm sóc pin và chi phí sạc.', 2),
  ('Tài chính mua xe', 'tai-chinh-mua-xe', 'Trả góp, chi phí lăn bánh, bảo hiểm và các khoản phí.', 3),
  ('Kinh nghiệm chọn xe', 'kinh-nghiem-chon-xe', 'So sánh, lựa chọn mẫu xe và phiên bản phù hợp nhu cầu.', 4),
  ('Tin VinFast', 'tin-vinfast', 'Cập nhật sản phẩm và chương trình bán hàng đã được công bố.', 5)
on conflict (slug) do nothing;
