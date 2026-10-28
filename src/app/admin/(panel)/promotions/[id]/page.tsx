import { notFound } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Card, Field, Flash, PageHeader } from "@/components/admin/ui";
import { savePromotion } from "@/app/admin/_actions/promotions";
import { isoToLocal } from "@/lib/admin-format";
import { PROMO_TYPE_LABELS } from "@/lib/constants";
import type { Promotion } from "@/lib/types";

export default async function PromotionEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireStaff();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const sb = await createSessionClient();
  const { data: vehicles } = await sb.from("vehicles").select("id, name").is("deleted_at", null).order("sort_order");
  let p: Promotion | null = null;
  if (id !== "new") {
    const { data } = await sb.from("promotions").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    p = data as Promotion;
  }
  return (
    <>
      <PageHeader title={p ? "Sửa ưu đãi" : "Thêm ưu đãi"} />
      <Flash error={sp.error} />
      <Card className="max-w-3xl">
        <form action={savePromotion} className="grid gap-4 sm:grid-cols-2">
          {p ? <input type="hidden" name="id" value={p.id} /> : null}
          <Field label="Tên chương trình *" className="sm:col-span-2"><input name="title" required defaultValue={p?.title} className="field" /></Field>
          <Field label="Loại ưu đãi">
            <select name="promo_type" defaultValue={p?.promo_type ?? "cash"} className="field">
              {Object.entries(PROMO_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field label="Mẫu xe áp dụng">
            <select name="vehicle_id" defaultValue={p?.vehicle_id ?? ""} className="field">
              <option value="">Chung / nhiều mẫu</option>
              {vehicles?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <Field label="Bắt đầu (giờ Việt Nam)"><input type="datetime-local" name="start_at" defaultValue={isoToLocal(p?.start_at)} className="field" /></Field>
          <Field label="Kết thúc (giờ Việt Nam)" hint="Có ngày kết thúc thì website hiển thị đếm ngược"><input type="datetime-local" name="end_at" defaultValue={isoToLocal(p?.end_at)} className="field" /></Field>
          <Field label="Mô tả" className="sm:col-span-2"><textarea name="description" rows={3} defaultValue={p?.description ?? ""} className="field" /></Field>
          <Field label="Điều kiện áp dụng" className="sm:col-span-2"><textarea name="terms" rows={3} defaultValue={p?.terms ?? ""} className="field" /></Field>
          <Field label="Nguồn xác nhận (nội bộ)" hint="Không hiển thị công khai" className="sm:col-span-2"><input name="source_note" defaultValue={p?.source_note ?? ""} className="field" /></Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="is_published" defaultChecked={p?.is_published} className="size-4" /> Công khai trên website</label>
          <div><button className="btn btn-primary btn-sm">Lưu ưu đãi</button></div>
        </form>
      </Card>
    </>
  );
}
