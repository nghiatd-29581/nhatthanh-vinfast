import { createSessionClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Card, Field, Flash, PageHeader } from "@/components/admin/ui";
import { saveSettings } from "@/app/admin/_actions/settings";
import { DEFAULT_CONTACT, DEFAULT_FINANCE, DEFAULT_NOTICES, DEFAULT_SEO } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { ContactSettings, FinanceSettings, NoticeSettings, SeoSettings } from "@/lib/types";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const sb = await createSessionClient();
  const { data } = await sb.from("site_settings").select("key, value");
  const get = (k: string) => data?.find((r) => r.key === k)?.value ?? {};
  const c: ContactSettings = { ...DEFAULT_CONTACT, ...get("contact") };
  const f: FinanceSettings = { ...DEFAULT_FINANCE, ...get("finance") };
  const s: SeoSettings = { ...DEFAULT_SEO, ...get("seo") };
  const n: NoticeSettings = { ...DEFAULT_NOTICES, ...get("notices") };

  return (
    <>
      <PageHeader title="Liên hệ, SEO và tài chính" />
      <Flash ok={sp.ok} error={sp.error} />
      <form action={saveSettings} className="grid max-w-4xl gap-5">
        <Card title="Thông tin liên hệ">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên hiển thị"><input name="display_name" defaultValue={c.display_name} className="field" /></Field>
            <Field label="Hotline" hint="Nút gọi tự chuyển sang dạng tel:+84…"><input name="hotline" defaultValue={c.hotline} className="field" /></Field>
            <Field label="URL Zalo" hint="Dạng https://zalo.me/… — để trống sẽ ẩn nút Zalo" className="sm:col-span-2"><input name="zalo_url" type="url" defaultValue={c.zalo_url} className="field" /></Field>
            <Field label="Email"><input name="email" type="email" defaultValue={c.email} className="field" /></Field>
            <Field label="Thời gian làm việc"><input name="working_hours" defaultValue={c.working_hours} className="field" /></Field>
            <Field label="Địa chỉ / showroom" className="sm:col-span-2"><input name="address" defaultValue={c.address} className="field" /></Field>
          </div>
        </Card>
        <Card title="Thông số công cụ trả góp">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lãi suất năm mặc định (%)" hint="Để trống: khách tự nhập lãi suất"><input name="default_interest_rate" inputMode="decimal" defaultValue={f.default_interest_rate ?? ""} className="field" /></Field>
            <Field label="Nguồn lãi suất" hint="Hiển thị dưới ô lãi suất, ví dụ: Ngân hàng X, áp dụng từ ngày…"><input name="interest_rate_source" defaultValue={f.interest_rate_source} className="field" /></Field>
            <Field label="Tỷ lệ trả trước mặc định (%)"><input name="default_down_payment_percent" type="number" min={0} max={100} defaultValue={f.default_down_payment_percent} className="field" /></Field>
            <Field label="Thời hạn vay tối đa (tháng)"><input name="max_term_months" type="number" min={12} max={120} step={12} defaultValue={f.max_term_months} className="field" /></Field>
            <Field label="Các khoản phí tính sẵn" hint="Mỗi dòng: Tên phí | Số tiền | Ghi chú (chỉ nhập khi có số liệu xác nhận)" className="sm:col-span-2">
              <textarea name="extra_fees" rows={4} defaultValue={f.extra_fees.map((x) => [x.name, x.amount, x.note ?? ""].join(" | ")).join("\n")} className="field font-mono text-xs" />
            </Field>
            <Field label="Ghi chú về phí đăng ký" className="sm:col-span-2"><textarea name="registration_fee_note" rows={2} defaultValue={f.registration_fee_note} className="field" /></Field>
          </div>
        </Card>
        <Card title="SEO trang chủ">
          <div className="grid gap-4">
            <Field label="SEO title"><input name="seo_title" defaultValue={s.title} maxLength={70} className="field" /></Field>
            <Field label="SEO description"><textarea name="seo_description" rows={2} defaultValue={s.description} maxLength={170} className="field" /></Field>
          </div>
        </Card>
        <Card title="Thông báo giá và ưu đãi">
          <Field label="Câu thông báo hiển thị cạnh giá"><textarea name="price_notice" rows={2} defaultValue={n.price_notice} className="field" /></Field>
          <input type="hidden" name="data_updated_at_prev" value={n.data_updated_at ?? ""} />
          <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" name="touch_data_date" className="size-4" /> Đánh dấu dữ liệu xe vừa được rà soát hôm nay (hiện ở footer: {formatDate(n.data_updated_at)})</label>
        </Card>
        <div><button className="btn btn-primary">Lưu cấu hình</button></div>
      </form>
    </>
  );
}
