import { z } from "zod";
import { slugify } from "./format";
import { normalizeColors } from "./colors";
import { normalizeFaqs } from "./faqs";
export { normalizeFaqs };

/*
 * Nhập dữ liệu xe từ JSON (định dạng giống file "Xuất JSON").
 * - Chấp nhận null cho mọi trường không bắt buộc (file xuất ra luôn có null).
 * - FAQ chấp nhận cả {q, a} lẫn {question, answer}.
 * - Bỏ qua các trường hệ thống: id, created_at, updated_at, deleted_at, category (object).
 */

const text = z.string().trim().nullish();
const money = z.union([z.number(), z.string()]).nullish().transform((v, ctx) => {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n < 0) {
    ctx.addIssue({ code: "custom", message: "phải là số tiền (VD 278000000)" });
    return z.NEVER;
  }
  return Math.round(n);
});
const int = z.union([z.number(), z.string()]).nullish().transform((v, ctx) => {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isInteger(n)) {
    ctx.addIssue({ code: "custom", message: "phải là số nguyên" });
    return z.NEVER;
  }
  return n;
});
const primitive = z.union([z.string(), z.number(), z.boolean()]).nullable();
/** Thông số: chuẩn là { "Nhóm": { "Tên": "Giá trị" } }; giá trị phẳng { "Tên": "Giá trị" } được đưa vào nhóm "Thông số chung" */
const specs = z
  .record(z.string(), z.union([z.record(z.string(), primitive), primitive]))
  .nullish()
  .transform((g) => {
    const out: Record<string, Record<string, string>> = {};
    for (const [k, val] of Object.entries(g ?? {})) {
      if (val != null && typeof val === "object") {
        out[k] = { ...(out[k] ?? {}), ...Object.fromEntries(Object.entries(val).map(([a, b]) => [a, b == null ? "" : String(b)])) };
      } else {
        (out["Thông số chung"] ??= {})[k] = val == null ? "" : String(val);
      }
    }
    return out;
  });
const colors = z
  .array(z.object({ name: z.string(), hex: z.string().nullish(), hex2: z.string().nullish(), type: z.string().nullish() }))
  .nullish()
  .transform((a) => normalizeColors(a ?? []));
const highlights = z
  .array(z.object({ title: z.string(), text: z.string().nullish() }))
  .nullish()
  .transform((a) => (a ?? []).map((h) => ({ title: h.title, text: h.text ?? "" })));
const faqs = z
  .array(z.object({ q: z.string().optional(), a: z.string().optional(), question: z.string().optional(), answer: z.string().optional() }))
  .nullish()
  .transform((a) => normalizeFaqs(a));
const SALES = ["selling", "coming_soon", "paused", "contact"] as const;
const SALES_ALIAS: Record<string, (typeof SALES)[number]> = {
  selling: "selling", available: "selling", on_sale: "selling", "đang bán": "selling",
  coming_soon: "coming_soon", upcoming: "coming_soon", "sắp ra mắt": "coming_soon",
  paused: "paused", discontinued: "paused", stopped: "paused", "ngừng bán": "paused", "tạm ngừng": "paused",
  contact: "contact", "liên hệ": "contact",
};
const salesStatus = z.string().nullish().transform((v, ctx) => {
  if (v == null || v === "") return null;
  const m = SALES_ALIAS[v.trim().toLowerCase()];
  if (!m) {
    ctx.addIssue({ code: "custom", message: `"${v}" không hợp lệ — dùng selling, coming_soon, paused (ngừng bán) hoặc contact` });
    return z.NEVER;
  }
  return m;
});

export const importVariant = z.object({
  id: z.string().uuid().nullish(),
  name: z.string().trim().min(1, "thiếu tên phiên bản"),
  price: money,
  price_verified: z.boolean().nullish(),
  specifications: specs,
  features: z.array(z.string()).nullish().transform((a) => a ?? []),
  colors,
  sales_status: salesStatus,
  sort_order: int,
  is_active: z.boolean().nullish(),
});

export const importImage = z.object({
  id: z.string().uuid().nullish(),
  image_url: z.string().url("URL ảnh không hợp lệ").refine((u) => u.startsWith("https://"), "URL ảnh phải bắt đầu bằng https://"),
  storage_path: text,
  alt_text: text,
  image_type: z.enum(["exterior", "interior", "detail", "color"]).nullish(),
  color_name: text,
  sort_order: int,
  is_cover: z.boolean().nullish(),
  is_active: z.boolean().nullish(),
  usage_rights_note: text,
  source_url: text,
});

export const importVehicle = z.object({
  name: z.string({ message: "thiếu tên xe (name)" }).trim().min(1, "thiếu tên xe (name)"),
  slug: text,
  category_id: z.string().uuid().nullish(),
  category_slug: text,
  short_description: text,
  description: text,
  body_type: text,
  seats: int,
  range_km: int,
  range_standard: text,
  dimensions: text,
  power_text: text,
  warranty_text: text,
  specifications: specs,
  highlights,
  faqs,
  colors,
  listed_price: money,
  starting_price: money,
  rolling_price_estimate: money,
  display_price: text,
  price_note: text,
  price_verified: z.boolean().nullish(),
  price_updated_at: z.string().nullish(),
  price_source: text,
  data_source: text,
  cover_image: z.string().url("cover_image không phải URL hợp lệ").nullish().or(z.literal("")),
  sales_status: salesStatus,
  badges: z.array(z.string()).nullish(),
  is_featured: z.boolean().nullish(),
  show_on_landing: z.boolean().nullish(),
  is_published: z.boolean().nullish(),
  sort_order: int,
  seo_title: text,
  seo_description: text,
  variants: z.array(importVariant).nullish(),
  images: z.array(importImage).nullish(),
});

export type ImportVehicle = z.infer<typeof importVehicle>;

/** Đọc văn bản JSON, chấp nhận: mảng, một object, hoặc các object copy từ giữa mảng (có dấu phẩy thừa) */
export function parseLooseJson(input: string): { ok: true; value: unknown[] } | { ok: false; error: string } {
  const t = input.trim().replace(/^\uFEFF/, "");
  if (!t) return { ok: false, error: "Chưa có nội dung JSON." };
  const tries = [t, `[${t.replace(/,\s*$/, "")}]`];
  let firstError = "";
  for (const s of tries) {
    try {
      const v = JSON.parse(s);
      return { ok: true, value: Array.isArray(v) ? v : [v] };
    } catch (e) {
      if (!firstError) firstError = (e as Error).message;
    }
  }
  return { ok: false, error: `JSON sai cú pháp: ${firstError}. Thường do thiếu/thừa dấu phẩy, ngoặc hoặc dấu ngoặc kép.` };
}

/** Trường được ghi vào bảng vehicles — chỉ những trường có mặt trong file mới được cập nhật */
export const VEHICLE_FIELDS = [
  "name", "category_id", "short_description", "description", "body_type", "seats", "range_km", "range_standard", "dimensions",
  "power_text", "warranty_text", "specifications", "highlights", "faqs", "colors", "listed_price", "starting_price",
  "rolling_price_estimate", "display_price", "price_note", "price_source", "data_source", "cover_image", "sales_status",
  "badges", "is_featured", "show_on_landing", "sort_order", "seo_title", "seo_description",
] as const;

export function vehicleSlug(v: ImportVehicle): string {
  return slugify(v.slug || v.name);
}
