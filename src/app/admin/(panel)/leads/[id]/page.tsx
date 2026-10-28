import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { createSessionClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Card, Field, Flash, PageHeader } from "@/components/admin/ui";
import { updateLead } from "@/app/admin/_actions/leads";
import { isoToLocal } from "@/lib/admin-format";
import { INQUIRY_LABELS, LEAD_STATUS_LABELS } from "@/lib/constants";
import { formatDate, telHref } from "@/lib/format";
import type { Lead } from "@/lib/types";

export default async function LeadDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireStaff();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const sb = await createSessionClient();
  const { data } = await sb.from("leads").select("*, vehicle:vehicles(name)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const l = data as Lead;
  return (
    <>
      <PageHeader title={l.full_name} desc={`Mã ${l.code ?? l.id} • tạo lúc ${formatDate(l.created_at, true)}`}
        actions={<>
          <a href={telHref(l.phone)} className="btn btn-primary btn-sm"><Phone className="size-4" /> Gọi {l.phone}</a>
          <Link href="/admin/leads" className="btn btn-ghost btn-sm">Danh sách</Link>
        </>} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <Card title="Yêu cầu của khách">
          <dl className="grid gap-3 text-sm">
            {[
              ["Số điện thoại", l.phone],
              ["Xe quan tâm", l.vehicle?.name ?? "Chưa chọn"],
              ["Nhu cầu", INQUIRY_LABELS[l.inquiry_type]],
              ["Thời gian liên hệ mong muốn", l.preferred_contact_at ?? "—"],
              ["Trang gửi", l.source_page ?? "—"],
              ["Đồng ý liên hệ lúc", formatDate(l.consent_at, true)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-silver pb-2"><dt className="text-steel">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>
            ))}
          </dl>
          {l.message ? <div className="mt-4 rounded-xl bg-mist p-4 text-sm whitespace-pre-line">{l.message}</div> : null}
        </Card>
        <Card title="Chăm sóc khách hàng">
          <form action={updateLead} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={l.id} />
            <Field label="Trạng thái" className="sm:col-span-2">
              <select name="status" defaultValue={l.status} className="field">
                {Object.entries(LEAD_STATUS_LABELS).map(([k, lb]) => <option key={k} value={k}>{lb}</option>)}
              </select>
            </Field>
            <Field label="Lịch hẹn (lái thử / gặp mặt)"><input type="datetime-local" name="appointment_at" defaultValue={isoToLocal(l.appointment_at)} className="field" /></Field>
            <Field label="Liên hệ tiếp theo"><input type="datetime-local" name="next_contact_at" defaultValue={isoToLocal(l.next_contact_at)} className="field" /></Field>
            <Field label="Thêm ghi chú" hint="Ghi chú nội bộ, khách hàng không xem được" className="sm:col-span-2"><textarea name="new_note" rows={3} className="field" /></Field>
            <div className="sm:col-span-2"><button className="btn btn-primary btn-sm">Lưu cập nhật</button></div>
          </form>
          <h3 className="mt-6 text-sm font-semibold text-steel">Lịch sử ghi chú</h3>
          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-mist p-4 font-sans text-sm">{l.internal_notes || "Chưa có ghi chú."}</pre>
        </Card>
      </div>
    </>
  );
}
