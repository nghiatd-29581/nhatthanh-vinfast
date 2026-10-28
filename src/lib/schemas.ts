import { z } from "zod";
import { normalizePhone } from "./format";

export const leadSchema = z.object({
  full_name: z.string().trim().min(2, "Vui lòng nhập họ và tên").max(100, "Họ tên quá dài"),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((p) => /^0\d{9}$/.test(p), "Số điện thoại chưa đúng (10 số, bắt đầu bằng 0)"),
  vehicle_id: z
    .string()
    .optional()
    .transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null)),
  inquiry_type: z.enum(["quote", "test_drive", "finance", "promotion", "other"], { message: "Vui lòng chọn nhu cầu" }),
  preferred_contact_at: z.string().trim().max(100).optional().default(""),
  message: z.string().trim().max(1000, "Nội dung tối đa 1000 ký tự").optional().default(""),
  consent: z.literal("on", { message: "Vui lòng đồng ý để chúng tôi liên hệ tư vấn" }),
  source_page: z.string().max(200).optional().default("/"),
});
export type LeadFieldErrors = Partial<Record<keyof z.input<typeof leadSchema>, string>>;
