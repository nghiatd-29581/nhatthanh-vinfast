import Link from "next/link";
import { Phone } from "lucide-react";
import { createSessionClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Flash, PageHeader, Pagination, Pill } from "@/components/admin/ui";
import { quickLeadStatus } from "@/app/admin/_actions/leads";
import { applyLeadFilters } from "@/lib/lead-query";
import { INQUIRY_LABELS, LEAD_STATUS_LABELS } from "@/lib/constants";
import { formatDate, telHref } from "@/lib/format";
import type { Lead, LeadStatus } from "@/lib/types";

const PER = 25;

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const sb = await createSessionClient();
  const { data: vehicles } = await sb.from("vehicles").select("id, name").order("sort_order");
  const base = sb.from("leads").select("*, vehicle:vehicles(name)", { count: "exact" }).order("created_at", { ascending: false });
  const { data, count } = await applyLeadFilters(base, sp).range((page - 1) * PER, page * PER - 1);
  const leads = (data ?? []) as Lead[];
  const params = (p: number) => new URLSearchParams(Object.entries({ ...sp, page: String(p), ok: "", error: "" }).filter(([, v]) => v) as [string, string][]);
  const exportQs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && ["q", "status", "from", "to", "vehicle"].includes(k)) as [string, string][]);

  return (
    <>
      <PageHeader title="Khách hàng tiềm năng" desc="Danh sách chỉ hiển thị cho tài khoản quản trị."
        actions={staff.role === "admin" ? <a href={`/admin/leads/export?${exportQs}`} className="btn btn-ghost btn-sm">Xuất CSV</a> : null} />
      <Flash ok={sp.ok} error={sp.error} />

      <form className="mb-4 grid gap-2 rounded-2xl border border-silver bg-white p-3 md:grid-cols-[1.4fr_1fr_1fr_150px_150px_auto]">
        <input name="q" defaultValue={sp.q} placeholder="Tên hoặc số điện thoại" className="field" aria-label="Tìm kiếm" />
        <select name="status" defaultValue={sp.status ?? ""} className="field" aria-label="Trạng thái">
          <option value="">Mọi trạng thái</option>
          {Object.entries(LEAD_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select name="vehicle" defaultValue={sp.vehicle ?? ""} className="field" aria-label="Mẫu xe">
          <option value="">Mọi mẫu xe</option>
          {vehicles?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <input type="date" name="from" defaultValue={sp.from} className="field" aria-label="Từ ngày" />
        <input type="date" name="to" defaultValue={sp.to} className="field" aria-label="Đến ngày" />
        <button className="btn btn-primary btn-sm">Lọc</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-silver bg-white">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-mist text-steel">
            <tr><th className="p-3">Mã / ngày</th><th className="p-3">Khách hàng</th><th className="p-3">Xe quan tâm</th><th className="p-3">Nhu cầu</th><th className="p-3">Nguồn</th><th className="p-3">Lịch</th><th className="p-3">Trạng thái</th></tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-t border-silver align-top">
                <td className="p-3"><Link href={`/admin/leads/${l.id}`} className="font-semibold text-brand hover:underline">{l.code ?? l.id.slice(0, 8)}</Link><p className="text-xs text-steel">{formatDate(l.created_at, true)}</p></td>
                <td className="p-3">
                  <p className="font-semibold">{l.full_name}</p>
                  <a href={telHref(l.phone)} className="inline-flex items-center gap-1 text-brand tabular-nums"><Phone className="size-3.5" />{l.phone}</a>
                </td>
                <td className="p-3">{l.vehicle?.name ?? "—"}</td>
                <td className="p-3">{INQUIRY_LABELS[l.inquiry_type]}{l.preferred_contact_at ? <p className="text-xs text-steel">Liên hệ: {l.preferred_contact_at}</p> : null}</td>
                <td className="p-3 text-xs text-steel">{l.source_page ?? "—"}</td>
                <td className="p-3 text-xs">
                  {l.appointment_at ? <p>Hẹn: {formatDate(l.appointment_at, true)}</p> : null}
                  {l.next_contact_at ? <p className={new Date(l.next_contact_at).getTime() < Date.now() ? "font-semibold text-signal" : ""}>Gọi lại: {formatDate(l.next_contact_at, true)}</p> : null}
                </td>
                <td className="p-3">
                  <form action={quickLeadStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="back" value={`/admin/leads?${params(page)}`} />
                    <select name="status" defaultValue={l.status} className="field !min-h-9 !py-1 text-sm" aria-label="Trạng thái">
                      {Object.entries(LEAD_STATUS_LABELS).map(([k, lb]) => <option key={k} value={k}>{lb}</option>)}
                    </select>
                    <button className="text-xs font-semibold text-brand">Lưu</button>
                  </form>
                  {l.status === "new" ? <span className="mt-1 inline-block"><Pill tone="amber">{LEAD_STATUS_LABELS[l.status as LeadStatus]}</Pill></span> : null}
                </td>
              </tr>
            ))}
            {!leads.length && <tr><td colSpan={7} className="p-8 text-center text-steel">Không có khách hàng nào khớp bộ lọc.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={count ?? 0} perPage={PER} base={(p) => `/admin/leads?${params(p)}`} />
    </>
  );
}
