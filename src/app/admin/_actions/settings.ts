"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertStaff } from "@/lib/auth";
import { normalizePhone } from "@/lib/format";
import { parseMoneyInput, str, textToHighlights } from "@/lib/admin-format";

function done(path: string, error?: boolean) {
  revalidatePath("/", "layout");
  redirect(`${path}?${error ? "error=" + encodeURIComponent("Không lưu được") : "ok=" + encodeURIComponent("Đã lưu, website đã cập nhật")}`);
}

export async function saveSettings(formData: FormData) {
  const { supabase } = await assertStaff();
  const hotline = str(formData.get("hotline")) ?? "0349.63.65.67";
  const digits = normalizePhone(hotline);
  const zalo = str(formData.get("zalo_url")) ?? "";
  if (zalo && !/^https:\/\/(zalo\.me|chat\.zalo\.me|oa\.zalo\.me)\//.test(zalo)) {
    redirect("/admin/settings?error=" + encodeURIComponent("URL Zalo cần dạng https://zalo.me/..."));
  }
  const rate = String(formData.get("default_interest_rate") ?? "").replace(",", ".").trim();
  const fees = String(formData.get("extra_fees") ?? "")
    .split("\n")
    .map((l) => l.split("|").map((s) => s.trim()))
    .filter(([n, a]) => n && a)
    .map(([name, amount, note]) => ({ name, amount: parseMoneyInput(amount) ?? 0, note: note || undefined }));

  const rows = [
    {
      key: "contact",
      value: {
        display_name: str(formData.get("display_name")) ?? "Nhật Thanh VinFast",
        hotline,
        hotline_tel: digits.startsWith("0") ? "+84" + digits.slice(1) : digits,
        zalo_url: zalo,
        email: str(formData.get("email")) ?? "",
        address: str(formData.get("address")) ?? "",
        working_hours: str(formData.get("working_hours")) ?? "",
      },
    },
    {
      key: "finance",
      value: {
        default_interest_rate: rate && Number.isFinite(Number(rate)) ? Number(rate) : null,
        interest_rate_source: str(formData.get("interest_rate_source")) ?? "",
        default_down_payment_percent: Math.min(100, Math.max(0, Number(formData.get("default_down_payment_percent") ?? 20))),
        max_term_months: Math.min(120, Math.max(12, Number(formData.get("max_term_months") ?? 96))),
        registration_fee_note: str(formData.get("registration_fee_note")) ?? "",
        extra_fees: fees,
      },
    },
    { key: "seo", value: { title: str(formData.get("seo_title")) ?? "", description: str(formData.get("seo_description")) ?? "" } },
    {
      key: "notices",
      value: {
        price_notice: str(formData.get("price_notice")) ?? "",
        data_updated_at: formData.get("touch_data_date") === "on" ? new Date().toISOString() : (str(formData.get("data_updated_at_prev")) ?? null),
      },
    },
  ];
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  done("/admin/settings", !!error);
}

export async function saveContent(formData: FormData) {
  const { supabase } = await assertStaff();
  const rows = [
    {
      section_key: "hero",
      content: {
        title: str(formData.get("hero_title")) ?? "",
        subtitle: str(formData.get("hero_subtitle")) ?? "",
        image_url: str(formData.get("hero_image_url")) ?? "",
        image_alt: str(formData.get("hero_image_alt")) ?? "",
        vehicle_slug: str(formData.get("hero_vehicle_slug")) ?? "",
        primary_cta: str(formData.get("primary_cta")) ?? "Khám phá các dòng xe",
        secondary_cta: str(formData.get("secondary_cta")) ?? "Nhận tư vấn ngay",
        tertiary_cta: str(formData.get("tertiary_cta")) ?? "Đăng ký lái thử",
      },
    },
    { section_key: "about", content: { title: str(formData.get("about_title")) ?? "", points: textToHighlights(String(formData.get("about_points") ?? "")) } },
    { section_key: "privacy", content: { body: str(formData.get("privacy")) ?? "" } },
    { section_key: "terms", content: { body: str(formData.get("terms")) ?? "" } },
  ];
  const { error } = await supabase.from("site_content").upsert(rows, { onConflict: "section_key" });
  done("/admin/content", !!error);
}
