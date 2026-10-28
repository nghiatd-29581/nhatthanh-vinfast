import { LEAD_STATUS_LABELS } from "./constants";

export interface LeadFilters { q?: string; status?: string; from?: string; to?: string; vehicle?: string }

/** Áp dụng bộ lọc lead dùng chung cho trang danh sách và xuất CSV */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyLeadFilters(query: any, f: LeadFilters) {
  let q = query;
  if (f.status && f.status in LEAD_STATUS_LABELS) q = q.eq("status", f.status);
  if (f.vehicle) q = q.eq("vehicle_id", f.vehicle);
  if (f.from) q = q.gte("created_at", new Date(`${f.from}T00:00:00+07:00`).toISOString());
  if (f.to) q = q.lte("created_at", new Date(`${f.to}T23:59:59+07:00`).toISOString());
  if (f.q) {
    const s = f.q.replace(/[%_,()]/g, "").trim();
    const digits = s.replace(/\D/g, "");
    q = digits.length >= 3 ? q.or(`phone.ilike.%${digits}%,full_name.ilike.%${s}%`) : q.ilike("full_name", `%${s}%`);
  }
  return q;
}
