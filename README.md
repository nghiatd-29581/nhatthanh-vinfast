# Nhật Thanh VinFast — Website tư vấn bán ô tô

Website hỗ trợ kinh doanh cá nhân của **Nhật Thanh VinFast — 0349.63.65.67**.
Đây **không phải** website chính thức của VinFast; thông báo này hiển thị ở footer, trang điều khoản và trong dữ liệu.

Công nghệ: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (PostgreSQL, Auth, Storage) · Vercel.

---

## 1. Cấu trúc thư mục

```
├── supabase/
│   ├── migrations/20261028000001_init.sql   # Schema, index, trigger, RLS, hàm submit_lead, bucket Storage
│   └── seed.sql                              # Danh mục, 7 mẫu xe (KHÔNG có giá/thông số), cấu hình mặc định
├── src/
│   ├── proxy.ts                              # (Next 16 "proxy", trước đây là middleware) làm mới phiên + chặn /admin
│   ├── app/
│   │   ├── layout.tsx, globals.css           # Design system, font Be Vietnam Pro
│   │   ├── (site)/                           # Website public
│   │   │   ├── page.tsx                      # Landing Page (9 section)
│   │   │   ├── xe/ , xe/[slug]/              # Danh sách + chi tiết xe
│   │   │   ├── so-sanh/ du-toan-chi-phi/ uu-dai/ lien-he/
│   │   │   └── chinh-sach-quyen-rieng-tu/ dieu-khoan-su-dung/
│   │   ├── actions/lead.ts                   # Server Action gửi form tư vấn
│   │   ├── admin/
│   │   │   ├── login/                        # Đăng nhập
│   │   │   ├── _actions/                     # Server Actions quản trị (luôn kiểm tra quyền)
│   │   │   └── (panel)/                      # Dashboard, vehicles, variants, pricing, promotions, leads, content, settings
│   │   ├── sitemap.ts, robots.ts, not-found.tsx
│   ├── components/site/ …                    # Hero, VehicleCard, VehicleStage, LoanCalculator, CompareTool, LeadForm…
│   ├── components/admin/ …                   # AdminNav, ImageManager, UI kit
│   └── lib/                                  # data (đọc public), auth, loan (công thức), format, schemas, supabase clients
├── .env.example
└── next.config.ts                            # remotePatterns ảnh, security headers
```

## 2. Cài đặt

Yêu cầu Node.js ≥ 20.9.

```bash
npm install
cp .env.example .env.local      # rồi điền giá trị
npm run dev                     # http://localhost:3000
```

Chưa điền Supabase vẫn chạy được: website public ở **chế độ demo** (dữ liệu mẫu, có nhãn đỏ), form tư vấn báo chưa kết nối, Admin chuyển về trang đăng nhập với thông báo cấu hình.

Kiểm tra: `npm run typecheck` và `npm run build`.

## 3. Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Có | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Có | Anon / publishable key (an toàn ở trình duyệt vì mọi quyền do RLS kiểm soát) |
| `NEXT_PUBLIC_SITE_URL` | Có | Domain chính thức, dùng cho canonical, sitemap, Open Graph |
| `NEXT_PUBLIC_IMAGE_HOSTS` | Không | Host ảnh ngoài được tối ưu qua `next/image`, phân tách dấu phẩy |
| `LEAD_RATE_LIMIT_SALT` | Nên có | Chuỗi ngẫu nhiên để băm IP khi chống spam |

Dự án **không dùng** `service_role` key ở bất cứ đâu.

## 4. Tạo Supabase project

1. Tạo project tại supabase.com, region gần Việt Nam (Singapore).
2. **SQL Editor** → chạy toàn bộ `supabase/migrations/20261028000001_init.sql`, sau đó `supabase/seed.sql`.
   (Hoặc dùng Supabase CLI: `supabase link` → `supabase db push` → chạy seed.)
3. **Project Settings → API**: copy URL và anon key vào `.env.local`.
4. **Authentication → Sign In / Providers**: tắt *Allow new users to sign up* (chỉ admin tạo tài khoản). Dù có ai tự đăng ký, tài khoản mới mặc định `role = 'none'` và không vào được Admin.
5. **Authentication → URL Configuration**: đặt Site URL bằng domain thật.
6. Bucket `vehicle-images` đã được migration tạo sẵn (public read, chỉ admin/editor ghi, tối đa 8MB, JPG/PNG/WebP/AVIF).

## 5. Tạo tài khoản admin an toàn

1. **Authentication → Users → Add user → Create new user**: nhập email và mật khẩu mạnh (≥ 12 ký tự), tick *Auto Confirm User*. Mật khẩu được Supabase Auth băm, không lưu plaintext.
2. Cấp quyền bằng SQL Editor (chỉ người có quyền vào Supabase Dashboard mới làm được):

```sql
update public.profiles
set role = 'admin', full_name = 'Nhật Thanh'
where id = (select id from auth.users where email = 'email-cua-ban@example.com');
```

Vai trò: `admin` (toàn quyền, được xuất CSV lead, xoá lead), `editor` (quản lý nội dung và lead, không xuất CSV), `none` (không có quyền).
Người dùng không thể tự nâng quyền: bảng `profiles` chỉ admin được cập nhật (RLS).

## 6. Bảo mật đã áp dụng

- RLS bật trên mọi bảng. Public chỉ đọc xe/phiên bản/ảnh đã xuất bản, ưu đãi đã công khai, cấu hình và nội dung.
- Bảng `leads` **không có policy cho anon**. Khách chỉ ghi qua hàm `submit_lead()` (security definer) — validate lại ở DB, chống trùng (cùng SĐT + nhu cầu trong 30 phút), giới hạn 5 lần/giờ/IP (IP được băm SHA-256 kèm salt, không lưu IP thô).
- Form có honeypot và kiểm tra thời gian điền tối thiểu; lỗi trả về cho khách không chứa chi tiết hệ thống; không log dữ liệu cá nhân.
- `/admin/*` được chặn ở `proxy.ts`, kiểm tra lại quyền ở mỗi trang (`requireStaff`) và mỗi Server Action (`assertStaff`), cuối cùng là RLS.
- Xuất CSV chỉ cho `admin`, có chống CSV injection, `Cache-Control: no-store`.
- Security headers cơ bản, `noindex` cho Admin, robots chặn `/admin`.

## 7. Dữ liệu xe, giá và hình ảnh

**Dữ liệu khởi tạo không chứa giá, thông số hay phân khúc.** Mọi trường chưa có hiển thị “Chưa cập nhật” / “Liên hệ để nhận báo giá”. Quy trình cập nhật:

1. Admin → Quản lý xe → sửa từng xe: danh mục, số chỗ, quãng đường (ghi chuẩn đo NEDC/WLTP…), kích thước, thông số, màu, điểm nổi bật, FAQ. Ghi *Nguồn dữ liệu*.
2. Tab **Giá**: nhập giá niêm yết / giá bán tham khảo / lăn bánh ước tính, ghi **nguồn xác minh**, rồi tick *“Tôi đã kiểm tra giá…”* để công khai. Không tick → giá chỉ lưu nội bộ. Giá quá 30 ngày được đánh dấu “cần kiểm tra lại” trên Dashboard.
3. Tab **Phiên bản**: mỗi phiên bản có giá, trang bị, thông số riêng (không gộp với phiên bản khác), màu, trạng thái.
4. Tab **Hình ảnh**: tải nhiều ảnh lên Supabase Storage hoặc thêm URL, kéo thả sắp xếp, đặt ảnh đại diện, gán loại (ngoại thất/nội thất/chi tiết/màu), màu, phiên bản, ghi chú quyền sử dụng, nút **Kiểm tra URL ảnh lỗi**.
5. Nhập hàng loạt: **Quản lý xe → Nhập JSON** (cập nhật theo slug; luôn về trạng thái nháp, giá chưa xác minh).

### Cấu hình URL ảnh ngoài

- Ảnh trong Supabase Storage tự được tối ưu (AVIF/WebP, responsive).
- Ảnh từ host khác: thêm host vào `NEXT_PUBLIC_IMAGE_HOSTS`, ví dụ `NEXT_PUBLIC_IMAGE_HOSTS=cdn.example.com`, rồi **deploy lại** (đây là cấu hình build). Host chưa khai báo vẫn hiển thị bằng thẻ `<img>` thường (không tối ưu).
- Chỉ dùng ảnh bạn được phép sử dụng. Website **không** tự cào ảnh hay dữ liệu từ vinfastauto.com. Cách ổn định nhất là tải ảnh được phép lên Supabase Storage.
- Ảnh lỗi tự chuyển sang ảnh giữ chỗ có nhãn “Ảnh minh họa”, không làm hỏng trang.

## 8. Công cụ dự toán trả góp

- Hai phương pháp: **dư nợ giảm dần** (gốc cố định, lãi tính trên dư nợ đầu kỳ) và **niên kim/trả đều** `A = P·r / (1 − (1+r)^−n)`, `r` = lãi năm/12.
- Giả định hiển thị ngay dưới kết quả: lãi cố định suốt kỳ, chưa gồm phí trả trước hạn/bảo hiểm khoản vay/phí hồ sơ.
- Không mặc định lãi suất: để trống trong *Cấu hình* thì khách tự nhập. Nếu nhập lãi suất mặc định, cần ghi nguồn (hiển thị dưới ô nhập). Các khoản phí tính sẵn cũng do Admin nhập.

## 9. Chạy local

```bash
npm run dev       # phát triển
npm run build && npm start   # kiểm tra bản production
```

Đăng nhập Admin tại `http://localhost:3000/admin/login`.

## 10. Deploy lên Vercel

1. Đẩy mã lên GitHub (file `.env*` đã nằm trong `.gitignore`).
2. Vercel → **Add New Project** → chọn repo. Framework: Next.js (tự nhận).
3. **Settings → Environment Variables** (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (ví dụ `https://nhatthanhvinfast.vn`)
   - `NEXT_PUBLIC_IMAGE_HOSTS` (nếu có)
   - `LEAD_RATE_LIMIT_SALT`
4. Deploy. Gắn domain riêng ở **Settings → Domains**, cập nhật lại `NEXT_PUBLIC_SITE_URL` và Site URL trong Supabase Auth.
5. Nội dung (xe, giá, ưu đãi, hero, liên hệ) thay đổi qua Admin sẽ hiển thị trong khoảng 1 phút (ISR + revalidate khi lưu), **không cần deploy lại**. Chỉ thay đổi code hoặc `NEXT_PUBLIC_IMAGE_HOSTS` mới cần deploy.

## 11. Trạng thái chức năng

### Đã hoàn thành (đã typecheck và build production thành công)
- Landing Page 9 section: hero cinematic (tên mẫu xe cỡ lớn làm nền, hiệu ứng luồng sáng một lần), danh mục xe có bộ lọc (phân khúc, giá, trạng thái, tìm kiếm), khu trưng bày theo tab (ngoại thất/nội thất/màu/công nghệ/thông số, đổi ảnh theo màu), ưu đãi có đếm ngược khi có ngày kết thúc, dự toán trả góp kèm lịch trả nợ, so sánh tối đa 3 xe, “Vì sao chọn Nhật Thanh”, form tư vấn, footer có thông báo miễn trừ.
- Các trang `/xe`, `/xe/[slug]` (breadcrumb, giá + thời điểm/nguồn, gallery, phiên bản, thông số, nổi bật, trả góp, ưu đãi, FAQ, xe liên quan, form), `/so-sanh`, `/du-toan-chi-phi`, `/uu-dai`, `/lien-he`, chính sách, điều khoản.
- Hotline ở header, hero, footer, thanh liên hệ nổi trên mobile (chừa padding để không che nút gửi form), nút nổi trên desktop; `tel:+84349636567`; Zalo chỉ hiện khi Admin cấu hình URL.
- SEO: metadata riêng từng trang, canonical, Open Graph, sitemap, robots, JSON-LD `Car` (chỉ khai giá khi đã xác minh), `BreadcrumbList`, `FAQPage`.
- Admin: đăng nhập/đăng xuất, Dashboard số liệu thật, CRUD xe (nháp/xuất bản, ẩn, xoá mềm/khôi phục, nhân bản, nổi bật, hiện trang chủ, sắp xếp, tìm kiếm, lọc, phân trang, cảnh báo thiếu dữ liệu), duyệt giá, phiên bản, quản lý ảnh, ưu đãi, lead (tìm kiếm, lọc ngày/trạng thái/xe, đổi trạng thái, ghi chú có dấu thời gian, lịch hẹn, gọi lại, gọi điện, xuất CSV), nội dung Landing Page, liên hệ/SEO/tài chính, nhập/xuất JSON.

### Cần bạn bổ sung hoặc còn thiếu
- **Dữ liệu thật**: giá, thông số, phân khúc, ảnh xe, URL Zalo, địa chỉ — nhập qua Admin từ nguồn chính thức.
- **Chưa kiểm thử với một Supabase project thật** trong môi trường phát triển này. Sau khi chạy migration, hãy kiểm tra các luồng: gửi form → lead xuất hiện; đăng nhập; sửa xe; upload ảnh; truy cập `/admin` khi chưa đăng nhập bị chặn.
- Chưa có trang quản lý **danh mục xe** trong Admin (sửa bằng SQL/Table Editor của Supabase).
- Chưa có **thông báo lead mới** qua email/Zalo/Telegram. Có thể thêm bằng Supabase Database Webhook trên bảng `leads`.
- Chưa có nén ảnh phía trình duyệt trước khi upload (đã giới hạn 8MB; ảnh hiển thị được `next/image` tối ưu).
- Chưa có kiểm thử tự động (unit/e2e) và ESLint config. Có thể bổ sung Vitest cho `src/lib/loan.ts` và Playwright cho luồng form.
- Không dùng shadcn/ui và React Hook Form: các thành phần được viết gọn bằng Tailwind; form dùng Server Action + `useActionState` + Zod để giảm JavaScript phía client. Có thể thêm shadcn/ui nếu cần thành phần phức tạp hơn.
- Font Be Vietnam Pro tải từ Google Fonts lúc chạy; có fallback hệ thống nếu không tải được.
