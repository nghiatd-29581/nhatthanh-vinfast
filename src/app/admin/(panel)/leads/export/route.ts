import { NextResponse, type NextRequest } from "next/server";
import { getStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { applyLeadFilters } from "@/lib/lead-query";
import { INQUIRY_LABELS, LEAD_STATUS_LABELS } from "@/lib/constants";
import type { Lead } from "@/lib/types";

/** Xuất CSV — chỉ role "admin" (biên tập viên không được xuất dữ liệu cá nhân hàng loạt) */
export async function GET(req: NextRequest) {
  const staff = await getStaff();
  if (!staff || staff.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sb = await createSessionClient();
  const f = Object.fromEntries(req.nextUrl.searchParams);
  const { data } = await applyLeadFilters(sb.from("leads").select("*, vehicle:vehicles(name)").order("created_at", { ascending: false }).limit(5000), f);
  const esc = (v: unknown) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s; // chống CSV injection
    return `"${s.replace(/"/g, '""')}"`;
  };
  const header = ["Mã", "Ngày tạo", "Họ tên", "Số điện thoại", "Xe quan tâm", "Nhu cầu", "Trạng thái", "Nguồn", "Thời gian liên hệ", "Lịch hẹn", "Gọi lại", "Nội dung", "Ghi chú"];
  const rows = ((data ?? []) as Lead[]).map((l) => [
    l.code, l.created_at, l.full_name, l.phone, l.vehicle?.name, INQUIRY_LABELS[l.inquiry_type], LEAD_STATUS_LABELS[l.status],
    l.source_page, l.preferred_contact_at, l.appointment_at, l.next_contact_at, l.message, l.internal_notes,
  ].map(esc).join(","));
  const csv = "\uFEFF" + [header.map(esc).join(","), ...rows].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
