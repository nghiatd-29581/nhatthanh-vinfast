import type { Vehicle } from "./types";

/**
 * DỮ LIỆU MẪU — chỉ dùng khi chưa kết nối Supabase để dựng giao diện.
 * Không chứa giá, thông số hay phân khúc chưa xác minh. Đồng bộ với supabase/seed.sql.
 */
const base = {
  category_id: null,
  description: null,
  body_type: null,
  seats: null,
  range_km: null,
  range_standard: null,
  dimensions: null,
  power_text: null,
  warranty_text: null,
  specifications: {},
  highlights: [],
  faqs: [],
  colors: [],
  listed_price: null,
  starting_price: null,
  rolling_price_estimate: null,
  display_price: null,
  price_note: null,
  price_verified: false,
  price_updated_at: null,
  price_source: null,
  data_source: "https://vinfastauto.com/vn_vi",
  cover_image: null,
  sales_status: "contact" as const,
  badges: [],
  is_featured: false,
  show_on_landing: true,
  is_published: true,
  deleted_at: null,
  seo_title: null,
  seo_description: null,
  created_at: "2026-10-28T00:00:00.000Z",
  updated_at: "2026-10-28T00:00:00.000Z",
  category: null,
};

const models: [string, string, string][] = [
  ["VinFast VF 3", "vinfast-vf3", "Mẫu ô tô điện cỡ nhỏ. Thông tin chi tiết đang được cập nhật."],
  ["VinFast VF 5", "vinfast-vf5", "Mẫu ô tô điện cỡ nhỏ. Thông tin chi tiết đang được cập nhật."],
  ["VinFast VF 6", "vinfast-vf6", "Mẫu SUV điện. Thông tin chi tiết đang được cập nhật."],
  ["VinFast VF 7", "vinfast-vf7", "Mẫu SUV điện. Thông tin chi tiết đang được cập nhật."],
  ["VinFast VF 8", "vinfast-vf8", "Mẫu SUV điện. Thông tin chi tiết đang được cập nhật."],
  ["VinFast VF 9", "vinfast-vf9", "Mẫu SUV điện cỡ lớn. Thông tin chi tiết đang được cập nhật."],
  ["VinFast VF MPV 7", "vinfast-vf-mpv-7", "Mẫu xe đa dụng. Thông tin chi tiết đang được cập nhật."],
];

export const SAMPLE_VEHICLES: Vehicle[] = models.map(([name, slug, short], i) => ({
  ...base,
  id: `sample-${slug}`,
  name,
  slug,
  short_description: short,
  sort_order: i + 1,
}));
