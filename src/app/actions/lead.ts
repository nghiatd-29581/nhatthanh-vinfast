"use server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { leadSchema, type LeadFieldErrors } from "@/lib/schemas";
import { createPublicClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export interface LeadState {
  status: "idle" | "success" | "error";
  message?: string;
  code?: string;
  fieldErrors?: LeadFieldErrors;
}

const ERROR_TEXT: Record<string, string> = {
  rate_limited: "Bạn đã gửi khá nhiều yêu cầu. Vui lòng gọi trực tiếp hotline để được hỗ trợ ngay.",
  invalid_phone: "Số điện thoại chưa đúng (10 số, bắt đầu bằng 0).",
  invalid_name: "Vui lòng nhập họ và tên.",
  consent_required: "Vui lòng đồng ý để chúng tôi liên hệ tư vấn.",
};

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  // Chống bot: trường ẩn phải rỗng, và form phải mở ít nhất 2 giây
  if (String(formData.get("company_website") ?? "") !== "") return { status: "success", message: "Đã gửi thông tin." };
  const startedAt = Number(formData.get("started_at") ?? 0);
  if (!startedAt || Date.now() - startedAt < 2000) {
    return { status: "error", message: "Vui lòng kiểm tra lại thông tin và gửi lại sau vài giây." };
  }

  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: LeadFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof LeadFieldErrors;
      if (k && !fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { status: "error", message: "Vui lòng kiểm tra các trường được đánh dấu.", fieldErrors };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Biểu mẫu chưa được kết nối cơ sở dữ liệu. Vui lòng gọi hotline để được tư vấn." };
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "";
  const salt = process.env.LEAD_RATE_LIMIT_SALT ?? "";
  const ipHash = ip ? createHash("sha256").update(salt + ip).digest("hex") : null;

  const d = parsed.data;
  try {
    const { data, error } = await createPublicClient().rpc("submit_lead", {
      p_full_name: d.full_name,
      p_phone: d.phone,
      p_vehicle_id: d.vehicle_id,
      p_inquiry_type: d.inquiry_type,
      p_message: d.message,
      p_preferred_contact_at: d.preferred_contact_at,
      p_source_page: d.source_page,
      p_consent: true,
      p_ip_hash: ipHash,
    });
    if (error) throw new Error("rpc_failed");
    const res = data as { ok: boolean; error?: string; code?: string; duplicate?: boolean };
    if (!res.ok) return { status: "error", message: ERROR_TEXT[res.error ?? ""] ?? "Chưa gửi được yêu cầu. Vui lòng thử lại hoặc gọi hotline." };
    return {
      status: "success",
      code: res.code,
      message: res.duplicate
        ? "Yêu cầu của bạn đã được ghi nhận trước đó. Nhật Thanh sẽ liên hệ sớm."
        : "Đã gửi yêu cầu. Nhật Thanh sẽ liên hệ với bạn sớm nhất.",
    };
  } catch {
    // Không trả chi tiết lỗi hệ thống và không log dữ liệu cá nhân
    console.error("submitLead failed");
    return { status: "error", message: "Chưa gửi được yêu cầu. Vui lòng thử lại hoặc gọi hotline." };
  }
}
