-- =====================================================================
-- Nhật Thanh VinFast — schema khởi tạo
-- Chạy trong Supabase SQL Editor hoặc `supabase db push`
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'none' check (role in ('none', 'editor', 'admin')),
  created_at timestamptz not null default now()
);

-- Tự tạo profile (role = 'none') khi có user mới. Quyền admin chỉ cấp bằng SQL.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- is_staff(): admin hoặc editor. security definer để tránh đệ quy RLS.
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'));
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- vehicle_categories ----------
create table if not exists public.vehicle_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- vehicles ----------
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category_id uuid references public.vehicle_categories(id) on delete set null,
  short_description text,
  description text,
  body_type text,
  seats int check (seats is null or seats between 1 and 60),
  range_km int check (range_km is null or range_km > 0),
  range_standard text,                     -- vd: "NEDC", "WLTP" — ghi rõ chuẩn đo
  dimensions text,                         -- vd: "4.545 x 1.890 x 1.635 mm"
  power_text text,                         -- vd: "150 kW"
  warranty_text text,
  specifications jsonb not null default '{}'::jsonb,  -- { "Nhóm": { "Thông số": "Giá trị" } }
  highlights jsonb not null default '[]'::jsonb,      -- [{ "title": "", "text": "" }]
  faqs jsonb not null default '[]'::jsonb,            -- [{ "q": "", "a": "" }]
  colors jsonb not null default '[]'::jsonb,          -- [{ "name": "", "hex": "#..." }]
  -- Giá: tách bạch, chỉ hiển thị khi price_verified = true
  listed_price bigint check (listed_price is null or listed_price >= 0),          -- giá niêm yết
  starting_price bigint check (starting_price is null or starting_price >= 0),    -- giá bán tham khảo (từ)
  rolling_price_estimate bigint,                                                  -- giá lăn bánh ước tính
  display_price text,                       -- chuỗi hiển thị tuỳ chỉnh, vd "Từ 299 triệu"
  price_note text,                          -- điều kiện áp dụng
  price_verified boolean not null default false,
  price_updated_at timestamptz,
  price_source text,
  data_source text,
  cover_image text,
  sales_status text not null default 'contact' check (sales_status in ('selling', 'coming_soon', 'paused', 'contact')),
  badges text[] not null default '{}',      -- 'featured' | 'new' | 'promo'
  is_featured boolean not null default false,
  show_on_landing boolean not null default true,
  is_published boolean not null default false,
  sort_order int not null default 0,
  deleted_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vehicles_published_idx on public.vehicles (is_published, deleted_at, sort_order);
create index if not exists vehicles_category_idx on public.vehicles (category_id);
drop trigger if exists vehicles_updated_at on public.vehicles;
create trigger vehicles_updated_at before update on public.vehicles for each row execute function public.set_updated_at();

-- ---------- vehicle_variants ----------
create table if not exists public.vehicle_variants (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  name text not null,
  price bigint check (price is null or price >= 0),
  price_verified boolean not null default false,
  specifications jsonb not null default '{}'::jsonb,
  features jsonb not null default '[]'::jsonb,   -- ["Trang bị 1", ...]
  colors jsonb not null default '[]'::jsonb,
  sales_status text not null default 'contact' check (sales_status in ('selling', 'coming_soon', 'paused', 'contact')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists variants_vehicle_idx on public.vehicle_variants (vehicle_id, sort_order);
drop trigger if exists variants_updated_at on public.vehicle_variants;
create trigger variants_updated_at before update on public.vehicle_variants for each row execute function public.set_updated_at();

-- ---------- vehicle_images ----------
create table if not exists public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  variant_id uuid references public.vehicle_variants(id) on delete set null,
  image_url text not null,
  storage_path text,
  alt_text text not null default '',
  image_type text not null default 'exterior' check (image_type in ('exterior', 'interior', 'detail', 'color')),
  color_name text,
  sort_order int not null default 0,
  is_cover boolean not null default false,
  is_active boolean not null default true,
  usage_rights_note text,
  source_url text,
  created_at timestamptz not null default now()
);
create index if not exists images_vehicle_idx on public.vehicle_images (vehicle_id, sort_order);

-- ---------- promotions ----------
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  promo_type text not null default 'other' check (promo_type in ('cash', 'finance', 'installment', 'limited_time', 'other')),
  vehicle_id uuid references public.vehicles(id) on delete set null,   -- null = áp dụng nhiều mẫu / chung
  start_at timestamptz,
  end_at timestamptz,
  terms text,
  source_note text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at is null or start_at is null or end_at > start_at)
);
create index if not exists promotions_pub_idx on public.promotions (is_published, end_at);
drop trigger if exists promotions_updated_at on public.promotions;
create trigger promotions_updated_at before update on public.promotions for each row execute function public.set_updated_at();

-- ---------- leads ----------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  full_name text not null check (char_length(full_name) between 2 and 100),
  phone text not null check (phone ~ '^0[0-9]{9}$'),
  vehicle_id uuid references public.vehicles(id) on delete set null,
  inquiry_type text not null check (inquiry_type in ('quote', 'test_drive', 'finance', 'promotion', 'other')),
  message text check (message is null or char_length(message) <= 1000),
  consent_at timestamptz not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'consulting', 'test_drive_booked', 'quoted', 'won', 'lost')),
  source_page text,
  preferred_contact_at text,
  next_contact_at timestamptz,
  appointment_at timestamptz,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_phone_idx on public.leads (phone);
drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads for each row execute function public.set_updated_at();

create sequence if not exists public.lead_code_seq;
create or replace function public.set_lead_code()
returns trigger language plpgsql as $$
begin
  if new.code is null then
    new.code := 'NT' || to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYMMDD') || '-' || lpad(nextval('public.lead_code_seq')::text, 4, '0');
  end if;
  return new;
end $$;
drop trigger if exists leads_code on public.leads;
create trigger leads_code before insert on public.leads for each row execute function public.set_lead_code();

-- Bảng đếm tần suất gửi form (không lưu IP thô, chỉ lưu hash)
create table if not exists public.lead_rate_limits (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists lead_rate_ip_idx on public.lead_rate_limits (ip_hash, created_at desc);

-- ---------- site_settings / site_content ----------
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  content jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  updated_at timestamptz not null default now()
);
drop trigger if exists site_content_updated_at on public.site_content;
create trigger site_content_updated_at before update on public.site_content for each row execute function public.set_updated_at();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.vehicle_categories enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_variants enable row level security;
alter table public.vehicle_images enable row level security;
alter table public.promotions enable row level security;
alter table public.leads enable row level security;
alter table public.lead_rate_limits enable row level security;
alter table public.site_settings enable row level security;
alter table public.site_content enable row level security;

-- profiles: xem profile của chính mình; chỉ admin sửa được (không ai tự nâng quyền)
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles admin write" on public.profiles;
create policy "profiles admin write" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- categories
drop policy if exists "categories public read" on public.vehicle_categories;
create policy "categories public read" on public.vehicle_categories for select using (is_active or public.is_staff());
drop policy if exists "categories staff write" on public.vehicle_categories;
create policy "categories staff write" on public.vehicle_categories for all using (public.is_staff()) with check (public.is_staff());

-- vehicles: public chỉ đọc xe đã xuất bản, chưa xoá
drop policy if exists "vehicles public read" on public.vehicles;
create policy "vehicles public read" on public.vehicles for select
  using ((is_published and deleted_at is null) or public.is_staff());
drop policy if exists "vehicles staff write" on public.vehicles;
create policy "vehicles staff write" on public.vehicles for all using (public.is_staff()) with check (public.is_staff());

-- variants / images: theo xe cha
drop policy if exists "variants public read" on public.vehicle_variants;
create policy "variants public read" on public.vehicle_variants for select using (
  public.is_staff() or (is_active and exists (
    select 1 from public.vehicles v where v.id = vehicle_id and v.is_published and v.deleted_at is null)));
drop policy if exists "variants staff write" on public.vehicle_variants;
create policy "variants staff write" on public.vehicle_variants for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "images public read" on public.vehicle_images;
create policy "images public read" on public.vehicle_images for select using (
  public.is_staff() or (is_active and exists (
    select 1 from public.vehicles v where v.id = vehicle_id and v.is_published and v.deleted_at is null)));
drop policy if exists "images staff write" on public.vehicle_images;
create policy "images staff write" on public.vehicle_images for all using (public.is_staff()) with check (public.is_staff());

-- promotions
drop policy if exists "promotions public read" on public.promotions;
create policy "promotions public read" on public.promotions for select using (is_published or public.is_staff());
drop policy if exists "promotions staff write" on public.promotions;
create policy "promotions staff write" on public.promotions for all using (public.is_staff()) with check (public.is_staff());

-- leads: KHÔNG có policy cho anon. Public chỉ ghi qua hàm submit_lead().
drop policy if exists "leads staff read" on public.leads;
create policy "leads staff read" on public.leads for select using (public.is_staff());
drop policy if exists "leads staff update" on public.leads;
create policy "leads staff update" on public.leads for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "leads admin delete" on public.leads;
create policy "leads admin delete" on public.leads for delete using (public.is_admin());

-- lead_rate_limits: không ai đọc/ghi trực tiếp (chỉ qua submit_lead)

-- settings / content: public đọc, staff ghi
drop policy if exists "settings public read" on public.site_settings;
create policy "settings public read" on public.site_settings for select using (true);
drop policy if exists "settings staff write" on public.site_settings;
create policy "settings staff write" on public.site_settings for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "content public read" on public.site_content;
create policy "content public read" on public.site_content for select using (is_published or public.is_staff());
drop policy if exists "content staff write" on public.site_content;
create policy "content staff write" on public.site_content for all using (public.is_staff()) with check (public.is_staff());

-- =====================================================================
-- submit_lead(): cổng ghi lead duy nhất cho khách public
-- - validate lại ở database
-- - chống trùng: cùng số điện thoại + cùng nhu cầu trong 30 phút
-- - giới hạn tần suất: tối đa 5 lần / giờ / IP-hash
-- =====================================================================
create or replace function public.submit_lead(
  p_full_name text,
  p_phone text,
  p_vehicle_id uuid,
  p_inquiry_type text,
  p_message text,
  p_preferred_contact_at text,
  p_source_page text,
  p_consent boolean,
  p_ip_hash text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_recent int;
begin
  if p_consent is not true then
    return jsonb_build_object('ok', false, 'error', 'consent_required');
  end if;
  if p_full_name is null or char_length(trim(p_full_name)) < 2 or char_length(p_full_name) > 100 then
    return jsonb_build_object('ok', false, 'error', 'invalid_name');
  end if;
  if p_phone is null or p_phone !~ '^0[0-9]{9}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_phone');
  end if;
  if p_inquiry_type not in ('quote', 'test_drive', 'finance', 'promotion', 'other') then
    return jsonb_build_object('ok', false, 'error', 'invalid_type');
  end if;

  if p_ip_hash is not null then
    select count(*) into v_recent from public.lead_rate_limits
      where ip_hash = p_ip_hash and created_at > now() - interval '1 hour';
    if v_recent >= 5 then
      return jsonb_build_object('ok', false, 'error', 'rate_limited');
    end if;
    insert into public.lead_rate_limits (ip_hash) values (p_ip_hash);
  end if;

  select code into v_code from public.leads
    where phone = p_phone and inquiry_type = p_inquiry_type and created_at > now() - interval '30 minutes'
    order by created_at desc limit 1;
  if v_code is not null then
    return jsonb_build_object('ok', true, 'duplicate', true, 'code', v_code);
  end if;

  if p_vehicle_id is not null and not exists (
    select 1 from public.vehicles where id = p_vehicle_id and is_published and deleted_at is null) then
    p_vehicle_id := null;
  end if;

  insert into public.leads (full_name, phone, vehicle_id, inquiry_type, message, preferred_contact_at, source_page, consent_at)
  values (trim(p_full_name), p_phone, p_vehicle_id, p_inquiry_type,
          nullif(left(trim(coalesce(p_message, '')), 1000), ''),
          nullif(left(trim(coalesce(p_preferred_contact_at, '')), 100), ''),
          left(p_source_page, 200), now())
  returning code into v_code;

  -- dọn bản ghi rate-limit cũ
  delete from public.lead_rate_limits where created_at < now() - interval '1 day';

  return jsonb_build_object('ok', true, 'duplicate', false, 'code', v_code);
end $$;

revoke all on function public.submit_lead(text, text, uuid, text, text, text, text, boolean, text) from public;
grant execute on function public.submit_lead(text, text, uuid, text, text, text, text, boolean, text) to anon, authenticated;

-- Thống kê lead theo xe cho Dashboard (chỉ staff)
create or replace function public.lead_counts_by_vehicle()
returns table (vehicle_id uuid, vehicle_name text, total bigint)
language sql stable security definer set search_path = public as $$
  select l.vehicle_id, coalesce(v.name, 'Chưa chọn xe'), count(*)
  from public.leads l left join public.vehicles v on v.id = l.vehicle_id
  where public.is_staff()
  group by l.vehicle_id, v.name
  order by count(*) desc;
$$;
grant execute on function public.lead_counts_by_vehicle() to authenticated;

-- =====================================================================
-- Storage: bucket ảnh xe (đọc public, chỉ staff ghi)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-images', 'vehicle-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

drop policy if exists "vehicle images public read" on storage.objects;
create policy "vehicle images public read" on storage.objects for select using (bucket_id = 'vehicle-images');
drop policy if exists "vehicle images staff insert" on storage.objects;
create policy "vehicle images staff insert" on storage.objects for insert with check (bucket_id = 'vehicle-images' and public.is_staff());
drop policy if exists "vehicle images staff update" on storage.objects;
create policy "vehicle images staff update" on storage.objects for update using (bucket_id = 'vehicle-images' and public.is_staff());
drop policy if exists "vehicle images staff delete" on storage.objects;
create policy "vehicle images staff delete" on storage.objects for delete using (bucket_id = 'vehicle-images' and public.is_staff());
