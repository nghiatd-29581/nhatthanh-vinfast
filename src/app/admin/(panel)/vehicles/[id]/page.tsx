import Link from "next/link";
import { notFound } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Card, Field, Flash, PageHeader, Pill } from "@/components/admin/ui";
import { ImageManager } from "@/components/admin/ImageManager";
import { ColorManager } from "@/components/admin/ColorManager";
import { normalizeColors } from "@/lib/colors";
import { deleteVariant, saveVariant, saveVehicle, saveVehiclePrice } from "@/app/admin/_actions/vehicles";
import { colorsToText, faqsToText, highlightsToText, listToText, specsToText } from "@/lib/admin-format";
import { formatDate, isPriceStale } from "@/lib/format";
import { SALES_STATUS_LABELS } from "@/lib/constants";
import type { Category, Variant, Vehicle, VehicleImage } from "@/lib/types";

const TABS = [
  { key: "info", label: "Thông tin" },
  { key: "price", label: "Giá" },
  { key: "colors", label: "Màu sắc" },
  { key: "variants", label: "Phiên bản" },
  { key: "images", label: "Hình ảnh" },
];

export default async function VehicleEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await requireStaff();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  const sb = await createSessionClient();
  const { data: categories } = await sb.from("vehicle_categories").select("*").order("sort_order");
  let v: Vehicle | null = null;
  if (!isNew) {
    const { data } = await sb.from("vehicles").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    v = data as Vehicle;
  }
  const tab = isNew ? "info" : (sp.tab ?? "info");

  return (
    <>
      <PageHeader
        title={isNew ? "Thêm xe" : v!.name}
        desc={isNew ? "Lưu nháp trước, sau đó bổ sung giá, phiên bản và hình ảnh." : `Cập nhật lần cuối ${formatDate(v!.updated_at, true)}`}
        actions={!isNew ? <>
          {v!.is_published && !v!.deleted_at ? <Link href={`/xe/${v!.slug}`} target="_blank" className="btn btn-ghost btn-sm">Xem trên website</Link> : null}
          <Link href="/admin/vehicles" className="btn btn-ghost btn-sm">Danh sách xe</Link>
        </> : null}
      />
      <Flash ok={sp.ok} error={sp.error} />
      {!isNew && (
        <nav className="mb-5 flex gap-1 overflow-x-auto border-b border-silver" aria-label="Mục chỉnh sửa">
          {TABS.map((t) => (
            <Link key={t.key} href={`/admin/vehicles/${id}?tab=${t.key}`} aria-current={tab === t.key ? "page" : undefined}
              className={`border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === t.key ? "border-ink" : "border-transparent text-steel"}`}>{t.label}</Link>
          ))}
        </nav>
      )}

      {tab === "info" && <InfoForm v={v} categories={(categories ?? []) as Category[]} />}
      {tab === "price" && v && <PriceForm v={v} />}
      {tab === "colors" && v && <ColorsTab v={v} />}
      {tab === "variants" && v && <VariantsTab v={v} />}
      {tab === "images" && v && <ImagesTab v={v} />}
    </>
  );
}

function InfoForm({ v, categories }: { v: Vehicle | null; categories: Category[] }) {
  return (
    <form action={saveVehicle} className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      {v ? <input type="hidden" name="id" value={v.id} /> : null}
      <div className="grid gap-5">
        <Card title="Thông tin cơ bản">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên xe *"><input name="name" required defaultValue={v?.name} className="field" /></Field>
            <Field label="Slug (URL)" hint="Để trống sẽ tự tạo từ tên, ví dụ vinfast-vf7"><input name="slug" defaultValue={v?.slug} className="field" pattern="[a-z0-9-]*" /></Field>
            <Field label="Danh mục">
              <select name="category_id" defaultValue={v?.category_id ?? ""} className="field">
                <option value="">Chưa phân loại</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Kiểu thân xe"><input name="body_type" defaultValue={v?.body_type ?? ""} className="field" placeholder="SUV, MPV, Hatchback…" /></Field>
            <Field label="Mô tả ngắn" className="sm:col-span-2"><textarea name="short_description" rows={2} defaultValue={v?.short_description ?? ""} className="field" /></Field>
            <Field label="Mô tả chi tiết" hint="Viết nội dung riêng, không sao chép nguyên văn từ website khác." className="sm:col-span-2"><textarea name="description" rows={6} defaultValue={v?.description ?? ""} className="field" /></Field>
          </div>
        </Card>
        <Card title="Thông số nổi bật">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Số chỗ"><input name="seats" type="number" min={1} max={60} defaultValue={v?.seats ?? ""} className="field" /></Field>
            <Field label="Quãng đường/lần sạc (km)"><input name="range_km" type="number" min={1} defaultValue={v?.range_km ?? ""} className="field" /></Field>
            <Field label="Chuẩn đo"><input name="range_standard" defaultValue={v?.range_standard ?? ""} className="field" placeholder="NEDC, WLTP…" /></Field>
            <Field label="Công suất"><input name="power_text" defaultValue={v?.power_text ?? ""} className="field" /></Field>
            <Field label="Kích thước D x R x C"><input name="dimensions" defaultValue={v?.dimensions ?? ""} className="field" /></Field>
            <Field label="Bảo hành"><input name="warranty_text" defaultValue={v?.warranty_text ?? ""} className="field" /></Field>
          </div>
          <Field label="Bảng thông số chi tiết" hint="Mỗi dòng: Nhóm > Tên thông số: Giá trị" className="mt-4">
            <textarea name="specifications" rows={8} defaultValue={specsToText(v?.specifications)} className="field font-mono text-xs" placeholder={"Kích thước > Chiều dài cơ sở: ...\nĐộng cơ > Công suất tối đa: ..."} />
          </Field>
          <p className="mt-4 rounded-xl bg-mist px-4 py-3 text-sm text-steel">
            Màu ngoại thất và nội thất được quản lý ở tab <b>Màu sắc</b>{v ? <> — <Link href={`/admin/vehicles/${v.id}?tab=colors`} className="font-semibold text-brand underline">mở tab Màu sắc</Link></> : " (sau khi lưu xe)"}.
          </p>
          <Field label="Công nghệ và điểm nổi bật" hint="Mỗi dòng: Tiêu đề | Nội dung" className="mt-4">
            <textarea name="highlights" rows={5} defaultValue={highlightsToText(v?.highlights)} className="field font-mono text-xs" />
          </Field>
          <Field label="Câu hỏi thường gặp" hint="Mỗi dòng: Câu hỏi | Trả lời" className="mt-4">
            <textarea name="faqs" rows={4} defaultValue={faqsToText(v?.faqs)} className="field font-mono text-xs" />
          </Field>
        </Card>
      </div>
      <div className="grid content-start gap-5">
        <Card title="Xuất bản">
          <div className="grid gap-3 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" name="is_published" defaultChecked={v?.is_published} className="size-4" /> Đang xuất bản</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="is_featured" defaultChecked={v?.is_featured} className="size-4" /> Xe nổi bật (trưng bày ở trang chủ)</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="show_on_landing" defaultChecked={v?.show_on_landing ?? true} className="size-4" /> Hiện trong danh mục trang chủ</label>
            <fieldset className="mt-2">
              <legend className="label">Nhãn hiển thị</legend>
              <div className="flex gap-4">
                {[["featured", "Nổi bật"], ["new", "Mới"], ["promo", "Ưu đãi"]].map(([k, l]) => (
                  <label key={k} className="flex items-center gap-2"><input type="checkbox" name="badges" value={k} defaultChecked={v?.badges?.includes(k)} className="size-4" /> {l}</label>
                ))}
              </div>
            </fieldset>
            <Field label="Trạng thái kinh doanh">
              <select name="sales_status" defaultValue={v?.sales_status ?? "contact"} className="field">
                {Object.entries(SALES_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
            <Field label="Thứ tự hiển thị"><input name="sort_order" type="number" defaultValue={v?.sort_order ?? 0} className="field" /></Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button name="intent" value="save" className="btn btn-primary btn-sm">Lưu</button>
            <button name="intent" value="draft" className="btn btn-ghost btn-sm">Lưu nháp</button>
            <button name="intent" value="publish" className="btn btn-ghost btn-sm">Lưu và xuất bản</button>
          </div>
        </Card>
        <Card title="Ảnh đại diện">
          <Field label="URL ảnh đại diện" hint="Hoặc chọn ảnh đại diện trong tab Hình ảnh"><input name="cover_image" type="url" defaultValue={v?.cover_image ?? ""} className="field" /></Field>
        </Card>
        <Card title="Nguồn và SEO">
          <div className="grid gap-4">
            <Field label="Nguồn dữ liệu"><input name="data_source" defaultValue={v?.data_source ?? ""} className="field" /></Field>
            <Field label="SEO title"><input name="seo_title" defaultValue={v?.seo_title ?? ""} maxLength={70} className="field" /></Field>
            <Field label="SEO description"><textarea name="seo_description" rows={3} defaultValue={v?.seo_description ?? ""} maxLength={170} className="field" /></Field>
          </div>
        </Card>
      </div>
    </form>
  );
}

function PriceForm({ v }: { v: Vehicle }) {
  const stale = isPriceStale(v.price_updated_at);
  return (
    <form action={saveVehiclePrice} className="grid max-w-3xl gap-5">
      <input type="hidden" name="id" value={v.id} />
      <Card title="Giá xe">
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          {v.price_verified ? <Pill tone="green">Đang công khai</Pill> : <Pill tone="amber">Chưa công khai</Pill>}
          <span className="text-steel">Cập nhật: {formatDate(v.price_updated_at, true)}</span>
          {v.price_verified && stale ? <Pill tone="amber">Giá đã hơn 30 ngày chưa kiểm tra</Pill> : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Giá niêm yết (₫)"><input name="listed_price" inputMode="numeric" defaultValue={v.listed_price?.toLocaleString("vi-VN") ?? ""} className="field tabular-nums" /></Field>
          <Field label="Giá bán tham khảo — từ (₫)"><input name="starting_price" inputMode="numeric" defaultValue={v.starting_price?.toLocaleString("vi-VN") ?? ""} className="field tabular-nums" /></Field>
          <Field label="Giá lăn bánh ước tính (₫)"><input name="rolling_price_estimate" inputMode="numeric" defaultValue={v.rolling_price_estimate?.toLocaleString("vi-VN") ?? ""} className="field tabular-nums" /></Field>
          <Field label="Chuỗi giá hiển thị" hint="Tuỳ chọn, ví dụ: Từ 299 triệu"><input name="display_price" defaultValue={v.display_price ?? ""} className="field" /></Field>
          <Field label="Nguồn xác minh *" hint="Bắt buộc khi công khai: tên tài liệu, ngày, đường dẫn…" className="sm:col-span-2"><input name="price_source" defaultValue={v.price_source ?? ""} className="field" /></Field>
          <Field label="Ghi chú điều kiện áp dụng" className="sm:col-span-2"><textarea name="price_note" rows={2} defaultValue={v.price_note ?? ""} className="field" /></Field>
        </div>
        <label className="mt-5 flex items-start gap-3 rounded-xl bg-mist p-4 text-sm">
          <input type="checkbox" name="price_verified" defaultChecked={v.price_verified} className="mt-0.5 size-4" />
          <span><b>Tôi đã kiểm tra giá với nguồn chính thức và cho phép hiển thị công khai.</b> Bỏ chọn để lưu giá nội bộ mà không hiển thị trên website.</span>
        </label>
        <button className="btn btn-primary btn-sm mt-5">Lưu giá</button>
      </Card>
    </form>
  );
}

async function VariantsTab({ v }: { v: Vehicle }) {
  const sb = await createSessionClient();
  const { data } = await sb.from("vehicle_variants").select("*").eq("vehicle_id", v.id).order("sort_order");
  const variants = (data ?? []) as Variant[];
  const form = (x: Variant | null) => (
    <form action={saveVariant} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="vehicle_id" value={v.id} />
      {x ? <input type="hidden" name="id" value={x.id} /> : null}
      <Field label="Tên phiên bản *"><input name="name" required defaultValue={x?.name} className="field" /></Field>
      <Field label="Giá (₫)"><input name="price" inputMode="numeric" defaultValue={x?.price?.toLocaleString("vi-VN") ?? ""} className="field tabular-nums" /></Field>
      <Field label="Trạng thái kinh doanh">
        <select name="sales_status" defaultValue={x?.sales_status ?? "contact"} className="field">
          {Object.entries(SALES_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </Field>
      <Field label="Thứ tự"><input name="sort_order" type="number" defaultValue={x?.sort_order ?? variants.length + 1} className="field" /></Field>
      <Field label="Trang bị" hint="Mỗi dòng một trang bị"><textarea name="features" rows={5} defaultValue={listToText(x?.features)} className="field text-sm" /></Field>
      <Field label="Thông số riêng" hint="Nhóm > Thông số: Giá trị. Để trống sẽ dùng thông số chung của xe."><textarea name="specifications" rows={5} defaultValue={specsToText(x?.specifications)} className="field font-mono text-xs" /></Field>
      <Field label="Màu của phiên bản" hint="Tên màu | #hex" className="sm:col-span-2"><textarea name="colors" rows={2} defaultValue={colorsToText(x?.colors)} className="field font-mono text-xs" /></Field>
      <div className="flex flex-wrap items-center gap-4 text-sm sm:col-span-2">
        <label className="flex items-center gap-2"><input type="checkbox" name="price_verified" defaultChecked={x?.price_verified} className="size-4" /> Giá đã xác minh, cho phép công khai</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="is_active" defaultChecked={x?.is_active ?? true} className="size-4" /> Đang hiển thị</label>
        <button className="btn btn-primary btn-sm ml-auto">{x ? "Lưu phiên bản" : "Thêm phiên bản"}</button>
      </div>
    </form>
  );
  return (
    <div className="grid gap-5">
      {variants.map((x) => (
        <Card key={x.id} title={x.name} actions={
          <form action={deleteVariant}><input type="hidden" name="id" value={x.id} /><input type="hidden" name="vehicle_id" value={v.id} /><button className="text-sm font-semibold text-signal">Xoá</button></form>
        }>{form(x)}</Card>
      ))}
      <Card title="Thêm phiên bản mới">{form(null)}</Card>
    </div>
  );
}

async function ImagesTab({ v }: { v: Vehicle }) {
  const sb = await createSessionClient();
  const [{ data: images }, { data: variants }] = await Promise.all([
    sb.from("vehicle_images").select("*").eq("vehicle_id", v.id).order("sort_order"),
    sb.from("vehicle_variants").select("id, name").eq("vehicle_id", v.id).order("sort_order"),
  ]);
  return <ImageManager vehicleId={v.id} images={(images ?? []) as VehicleImage[]} variants={variants ?? []} colors={normalizeColors(v.colors)} />;
}

async function ColorsTab({ v }: { v: Vehicle }) {
  const sb = await createSessionClient();
  const { data: images } = await sb.from("vehicle_images").select("color_name, image_type").eq("vehicle_id", v.id);
  return <ColorManager key={v.updated_at} vehicleId={v.id} colors={normalizeColors(v.colors)} images={(images ?? []) as Pick<VehicleImage, "color_name" | "image_type">[]} />;
}
