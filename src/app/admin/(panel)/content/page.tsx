import { createSessionClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Card, Field, Flash, PageHeader } from "@/components/admin/ui";
import { saveContent } from "@/app/admin/_actions/settings";
import { highlightsToText } from "@/lib/admin-format";
import { DEFAULT_ABOUT, DEFAULT_HERO } from "@/lib/constants";
import type { AboutContent, HeroContent } from "@/lib/types";

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const sb = await createSessionClient();
  const [{ data: rows }, { data: vehicles }] = await Promise.all([
    sb.from("site_content").select("section_key, content"),
    sb.from("vehicles").select("slug, name").is("deleted_at", null).order("sort_order"),
  ]);
  const get = (k: string) => rows?.find((r) => r.section_key === k)?.content ?? {};
  const hero = { ...DEFAULT_HERO, ...(get("hero") as Partial<HeroContent>) };
  const about = { ...DEFAULT_ABOUT, ...(get("about") as Partial<AboutContent>) };
  const privacy = (get("privacy") as { body?: string }).body ?? "";
  const terms = (get("terms") as { body?: string }).body ?? "";

  return (
    <>
      <PageHeader title="Nội dung Landing Page" desc="Thay đổi được lưu vào cơ sở dữ liệu và hiển thị trên website trong khoảng 1 phút, không cần deploy lại." />
      <Flash ok={sp.ok} error={sp.error} />
      <form action={saveContent} className="grid max-w-4xl gap-5">
        <Card title="Hero — màn hình mở đầu">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tiêu đề" className="sm:col-span-2"><input name="hero_title" defaultValue={hero.title} className="field" maxLength={90} /></Field>
            <Field label="Mô tả" className="sm:col-span-2"><input name="hero_subtitle" defaultValue={hero.subtitle} className="field" maxLength={160} /></Field>
            <Field label="Mẫu xe trưng bày">
              <select name="hero_vehicle_slug" defaultValue={hero.vehicle_slug} className="field">
                <option value="">Tự chọn xe nổi bật</option>
                {vehicles?.map((v) => <option key={v.slug} value={v.slug}>{v.name}</option>)}
              </select>
            </Field>
            <Field label="URL ảnh hero riêng" hint="Để trống sẽ dùng ảnh đại diện của mẫu xe. Ảnh PNG nền trong suốt hoặc nền tối đẹp nhất."><input name="hero_image_url" type="url" defaultValue={hero.image_url} className="field" /></Field>
            <Field label="Mô tả ảnh (alt)" className="sm:col-span-2"><input name="hero_image_alt" defaultValue={hero.image_alt} className="field" /></Field>
            <Field label="Nút chính"><input name="primary_cta" defaultValue={hero.primary_cta} className="field" /></Field>
            <Field label="Nút tư vấn"><input name="secondary_cta" defaultValue={hero.secondary_cta} className="field" /></Field>
            <Field label="Nút lái thử"><input name="tertiary_cta" defaultValue={hero.tertiary_cta} className="field" /></Field>
          </div>
        </Card>
        <Card title="Vì sao chọn Nhật Thanh">
          <Field label="Tiêu đề"><input name="about_title" defaultValue={about.title} className="field" /></Field>
          <Field label="Các điểm" hint="Mỗi dòng: Tiêu đề | Nội dung. Tránh cam kết chưa được xác nhận (giao ngay, giá thấp nhất…)." className="mt-4">
            <textarea name="about_points" rows={7} defaultValue={highlightsToText(about.points)} className="field text-sm" />
          </Field>
        </Card>
        <Card title="Chính sách và điều khoản">
          <Field label="Chính sách quyền riêng tư"><textarea name="privacy" rows={8} defaultValue={privacy} className="field text-sm" /></Field>
          <Field label="Điều khoản sử dụng" className="mt-4"><textarea name="terms" rows={6} defaultValue={terms} className="field text-sm" /></Field>
        </Card>
        <div><button className="btn btn-primary">Lưu nội dung</button></div>
      </form>
    </>
  );
}
