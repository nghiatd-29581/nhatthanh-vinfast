export type SalesStatus = "selling" | "coming_soon" | "paused" | "contact";
export type LeadStatus = "new" | "contacted" | "consulting" | "test_drive_booked" | "quoted" | "won" | "lost";
export type InquiryType = "quote" | "test_drive" | "finance" | "promotion" | "other";
export type ImageType = "exterior" | "interior" | "detail" | "color";
export type PromoType = "cash" | "finance" | "installment" | "limited_time" | "other";

export type SpecGroups = Record<string, Record<string, string>>;
export interface ColorOption { name: string; hex: string }
export interface Highlight { title: string; text: string }
export interface Faq { q: string; a: string }

export interface Category { id: string; name: string; slug: string; sort_order: number; is_active: boolean }

export interface Vehicle {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  short_description: string | null;
  description: string | null;
  body_type: string | null;
  seats: number | null;
  range_km: number | null;
  range_standard: string | null;
  dimensions: string | null;
  power_text: string | null;
  warranty_text: string | null;
  specifications: SpecGroups;
  highlights: Highlight[];
  faqs: Faq[];
  colors: ColorOption[];
  listed_price: number | null;
  starting_price: number | null;
  rolling_price_estimate: number | null;
  display_price: string | null;
  price_note: string | null;
  price_verified: boolean;
  price_updated_at: string | null;
  price_source: string | null;
  data_source: string | null;
  cover_image: string | null;
  sales_status: SalesStatus;
  badges: string[];
  is_featured: boolean;
  show_on_landing: boolean;
  is_published: boolean;
  sort_order: number;
  deleted_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
}

export interface Variant {
  id: string;
  vehicle_id: string;
  name: string;
  price: number | null;
  price_verified: boolean;
  specifications: SpecGroups;
  features: string[];
  colors: ColorOption[];
  sales_status: SalesStatus;
  sort_order: number;
  is_active: boolean;
}

export interface VehicleImage {
  id: string;
  vehicle_id: string;
  variant_id: string | null;
  image_url: string;
  storage_path: string | null;
  alt_text: string;
  image_type: ImageType;
  color_name: string | null;
  sort_order: number;
  is_cover: boolean;
  is_active: boolean;
  usage_rights_note: string | null;
  source_url: string | null;
}

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  promo_type: PromoType;
  vehicle_id: string | null;
  start_at: string | null;
  end_at: string | null;
  terms: string | null;
  source_note: string | null;
  is_published: boolean;
  vehicle?: { name: string; slug: string } | null;
}

export interface Lead {
  id: string;
  code: string | null;
  full_name: string;
  phone: string;
  vehicle_id: string | null;
  inquiry_type: InquiryType;
  message: string | null;
  consent_at: string;
  status: LeadStatus;
  source_page: string | null;
  preferred_contact_at: string | null;
  next_contact_at: string | null;
  appointment_at: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  vehicle?: { name: string } | null;
}

export interface ContactSettings {
  display_name: string;
  hotline: string;
  hotline_tel: string;
  zalo_url: string;
  email: string;
  address: string;
  working_hours: string;
}

export interface FinanceSettings {
  default_interest_rate: number | null;
  interest_rate_source: string;
  default_down_payment_percent: number;
  max_term_months: number;
  registration_fee_note: string;
  extra_fees: { name: string; amount: number; note?: string }[];
}

export interface SeoSettings { title: string; description: string }
export interface NoticeSettings { price_notice: string; data_updated_at: string | null }

export interface HeroContent {
  title: string;
  subtitle: string;
  image_url: string;
  image_alt: string;
  vehicle_slug: string;
  primary_cta: string;
  secondary_cta: string;
  tertiary_cta: string;
}

export interface AboutContent { title: string; points: Highlight[] }

export interface SiteData {
  contact: ContactSettings;
  finance: FinanceSettings;
  seo: SeoSettings;
  notices: NoticeSettings;
}
