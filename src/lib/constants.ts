import type { ContactSettings, FinanceSettings, HeroContent, AboutContent, SeoSettings, NoticeSettings, InquiryType, LeadStatus, SalesStatus, ImageType, PromoType } from "./types";

export const DEFAULT_CONTACT: ContactSettings = {
  display_name: "Nhật Thanh VinFast",
  hotline: "0349.63.65.67",
  hotline_tel: "+84349636567",
  zalo_url: "",
  email: "",
  address: "",
  working_hours: "",
};

export const DEFAULT_FINANCE: FinanceSettings = {
  default_interest_rate: null,
  interest_rate_source: "",
  default_down_payment_percent: 20,
  max_term_months: 96,
  registration_fee_note:
    "Lệ phí trước bạ, phí biển số, bảo hiểm và phí đăng kiểm phụ thuộc địa phương và thời điểm. Vui lòng liên hệ để được tính chính xác.",
  extra_fees: [],
};

export const DEFAULT_SEO: SeoSettings = {
  title: "Nhật Thanh VinFast — Tư vấn mua ô tô điện VinFast",
  description:
    "Tư vấn chọn xe, báo giá, lái thử và dự toán trả góp ô tô điện VinFast cùng Nhật Thanh. Hotline 0349.63.65.67.",
};

export const DEFAULT_NOTICES: NoticeSettings = {
  price_notice: "Giá bán, thông số, ưu đãi và tình trạng xe cần được xác nhận tại thời điểm giao dịch.",
  data_updated_at: null,
};

export const DEFAULT_HERO: HeroContent = {
  title: "Chọn chất riêng. Dẫn lối tương lai.",
  subtitle: "Khám phá thế giới ô tô điện VinFast cùng Nhật Thanh.",
  image_url: "",
  image_alt: "",
  vehicle_slug: "vinfast-vf7",
  primary_cta: "Khám phá các dòng xe",
  secondary_cta: "Nhận tư vấn ngay",
  tertiary_cta: "Đăng ký lái thử",
};

export const DEFAULT_ABOUT: AboutContent = {
  title: "Vì sao chọn Nhật Thanh VinFast?",
  points: [
    { title: "Tư vấn đúng nhu cầu", text: "Lắng nghe cách bạn di chuyển hằng ngày trước khi gợi ý mẫu xe." },
    { title: "Chọn đúng phiên bản", text: "So sánh rõ ràng từng phiên bản, màu sắc và trang bị để bạn tự quyết định." },
    { title: "Dự toán chi phí và tài chính", text: "Cùng bạn tính trả trước, khoản vay và chi phí lăn bánh dựa trên số liệu được xác nhận." },
    { title: "Đồng hành đến khi nhận xe", text: "Hỗ trợ từ lúc tìm hiểu, ký hợp đồng cho tới ngày bàn giao." },
    { title: "Thông tin minh bạch", text: "Mọi giá và ưu đãi đều ghi rõ nguồn và thời điểm cập nhật." },
  ],
};

export const DISCLAIMER =
  "Website tư vấn bán hàng do Nhật Thanh quản lý, không phải website chính thức của VinFast. Giá bán, thông số, ưu đãi và tình trạng xe cần được xác nhận tại thời điểm giao dịch.";

export const OFFICIAL_SOURCE = "https://vinfastauto.com/vn_vi";

export const INQUIRY_LABELS: Record<InquiryType, string> = {
  quote: "Nhận báo giá",
  test_drive: "Đăng ký lái thử",
  finance: "Tư vấn trả góp",
  promotion: "Tìm hiểu ưu đãi",
  other: "Khác",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  consulting: "Đang tư vấn",
  test_drive_booked: "Đã hẹn lái thử",
  quoted: "Đã báo giá",
  won: "Đã chốt",
  lost: "Không thành công",
};

export const SALES_STATUS_LABELS: Record<SalesStatus, string> = {
  selling: "Đang bán",
  coming_soon: "Sắp ra mắt",
  paused: "Tạm ngừng",
  contact: "Liên hệ",
};

export const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  exterior: "Ngoại thất",
  interior: "Nội thất",
  detail: "Chi tiết",
  color: "Màu sắc",
};

export const PROMO_TYPE_LABELS: Record<PromoType, string> = {
  cash: "Ưu đãi tiền mặt",
  finance: "Hỗ trợ tài chính",
  installment: "Trả góp",
  limited_time: "Ưu đãi có thời hạn",
  other: "Chính sách tư vấn",
};

export const BADGE_LABELS: Record<string, string> = { featured: "Nổi bật", new: "Mới", promo: "Ưu đãi" };

/** Số ngày giá được coi là "cũ" và cần kiểm tra lại */
export const PRICE_STALE_DAYS = 30;
