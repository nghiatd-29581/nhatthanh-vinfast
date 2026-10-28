-- =====================================================================
-- Dữ liệu khởi tạo — KHÔNG phải giá bán chính thức.
-- Tất cả giá, thông số, phân khúc để trống (null) và price_verified = false.
-- Hãy cập nhật từ https://vinfastauto.com/vn_vi hoặc tài liệu chính thức qua trang Admin,
-- ghi rõ nguồn (price_source / data_source) rồi bật "Đã xác minh giá".
-- =====================================================================

insert into public.vehicle_categories (name, slug, sort_order) values
  ('Xe đô thị', 'xe-do-thi', 1),
  ('SUV', 'suv', 2),
  ('Xe gia đình', 'xe-gia-dinh', 3),
  ('Xe cao cấp', 'xe-cao-cap', 4),
  ('Xe phục vụ kinh doanh', 'xe-kinh-doanh', 5)
on conflict (slug) do nothing;

insert into public.vehicles (name, slug, short_description, sort_order, is_published, show_on_landing, data_source, sales_status) values
  ('VinFast VF 3', 'vinfast-vf3', 'Mẫu ô tô điện cỡ nhỏ. Thông tin chi tiết đang được cập nhật.', 1, true, true, 'https://vinfastauto.com/vn_vi', 'contact'),
  ('VinFast VF 5', 'vinfast-vf5', 'Mẫu ô tô điện cỡ nhỏ. Thông tin chi tiết đang được cập nhật.', 2, true, true, 'https://vinfastauto.com/vn_vi', 'contact'),
  ('VinFast VF 6', 'vinfast-vf6', 'Mẫu SUV điện. Thông tin chi tiết đang được cập nhật.', 3, true, true, 'https://vinfastauto.com/vn_vi', 'contact'),
  ('VinFast VF 7', 'vinfast-vf7', 'Mẫu SUV điện. Thông tin chi tiết đang được cập nhật.', 4, true, true, 'https://vinfastauto.com/vn_vi', 'contact'),
  ('VinFast VF 8', 'vinfast-vf8', 'Mẫu SUV điện. Thông tin chi tiết đang được cập nhật.', 5, true, true, 'https://vinfastauto.com/vn_vi', 'contact'),
  ('VinFast VF 9', 'vinfast-vf9', 'Mẫu SUV điện cỡ lớn. Thông tin chi tiết đang được cập nhật.', 6, true, true, 'https://vinfastauto.com/vn_vi', 'contact'),
  ('VinFast VF MPV 7', 'vinfast-vf-mpv-7', 'Mẫu xe đa dụng. Thông tin chi tiết đang được cập nhật.', 7, true, true, 'https://vinfastauto.com/vn_vi', 'contact')
on conflict (slug) do nothing;

insert into public.site_settings (key, value) values
  ('contact', '{
    "display_name": "Nhật Thanh VinFast",
    "hotline": "0349.63.65.67",
    "hotline_tel": "+84349636567",
    "zalo_url": "",
    "email": "",
    "address": "",
    "working_hours": ""
  }'::jsonb),
  ('finance', '{
    "default_interest_rate": null,
    "interest_rate_source": "",
    "default_down_payment_percent": 20,
    "max_term_months": 96,
    "registration_fee_note": "Lệ phí trước bạ, phí biển số, bảo hiểm và phí đăng kiểm phụ thuộc địa phương và thời điểm. Vui lòng liên hệ để được tính chính xác.",
    "extra_fees": []
  }'::jsonb),
  ('seo', '{
    "title": "Nhật Thanh VinFast — Tư vấn mua ô tô điện VinFast",
    "description": "Tư vấn chọn xe, báo giá, lái thử và dự toán trả góp ô tô điện VinFast cùng Nhật Thanh. Hotline 0349.63.65.67."
  }'::jsonb),
  ('notices', '{
    "price_notice": "Giá bán, thông số, ưu đãi và tình trạng xe cần được xác nhận tại thời điểm giao dịch.",
    "data_updated_at": null
  }'::jsonb)
on conflict (key) do nothing;

insert into public.site_content (section_key, content) values
  ('hero', '{
    "title": "Chọn chất riêng. Dẫn lối tương lai.",
    "subtitle": "Khám phá thế giới ô tô điện VinFast cùng Nhật Thanh.",
    "image_url": "",
    "image_alt": "",
    "vehicle_slug": "vinfast-vf7",
    "primary_cta": "Khám phá các dòng xe",
    "secondary_cta": "Nhận tư vấn ngay",
    "tertiary_cta": "Đăng ký lái thử"
  }'::jsonb),
  ('about', '{
    "title": "Vì sao chọn Nhật Thanh VinFast?",
    "points": [
      {"title": "Tư vấn đúng nhu cầu", "text": "Lắng nghe cách bạn di chuyển hằng ngày trước khi gợi ý mẫu xe."},
      {"title": "Chọn đúng phiên bản", "text": "So sánh rõ ràng từng phiên bản, màu sắc và trang bị để bạn tự quyết định."},
      {"title": "Dự toán chi phí và tài chính", "text": "Cùng bạn tính trả trước, khoản vay và chi phí lăn bánh dựa trên số liệu được xác nhận."},
      {"title": "Đồng hành đến khi nhận xe", "text": "Hỗ trợ từ lúc tìm hiểu, ký hợp đồng cho tới ngày bàn giao."},
      {"title": "Thông tin minh bạch", "text": "Mọi giá và ưu đãi đều ghi rõ nguồn và thời điểm cập nhật."}
    ]
  }'::jsonb),
  ('privacy', '{
    "body": "Nhật Thanh VinFast thu thập họ tên, số điện thoại, mẫu xe quan tâm và nội dung bạn gửi qua biểu mẫu chỉ để liên hệ tư vấn theo yêu cầu của bạn. Dữ liệu được lưu trữ an toàn, không bán hoặc chia sẻ cho bên thứ ba ngoài mục đích tư vấn mua xe. Bạn có thể yêu cầu xem, sửa hoặc xoá dữ liệu của mình bất cứ lúc nào bằng cách gọi hotline 0349.63.65.67."
  }'::jsonb),
  ('terms', '{
    "body": "Website do Nhật Thanh — nhân viên tư vấn bán hàng — quản lý, không phải website chính thức của VinFast. Thông tin về giá, thông số, ưu đãi và tình trạng xe chỉ mang tính tham khảo và cần được xác nhận tại thời điểm giao dịch. Kết quả công cụ dự toán là ước tính, không phải cam kết tài chính."
  }'::jsonb)
on conflict (section_key) do nothing;
