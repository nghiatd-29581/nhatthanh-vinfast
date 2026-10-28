import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Card, PageHeader, Pill, Stat } from "@/components/admin/ui";
import { INQUIRY_LABELS, LEAD_STATUS_LABELS } from "@/lib/constants";
import { formatDate, isPriceStale } from "@/lib/format";
import type { Lead, LeadStatus } from "@/lib/types";

export default async function Dashboard() {
  await requireStaff();
  const sb = await createSessionClient();
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const inAWeek = new Date(Date.now() + 7 * 864e5).toISOString();
  const nowIso = new Date().toISOString();
  const count = { count: "exact" as const, head: true };

  const [published, newLeads7d, uncontacted, consulted, testDrives, latest, byVehicle, vehicles, expiring] = await Promise.all([
    sb.from("vehicles").select("id", count).eq("is_published", true).is("deleted_at", null),
    sb.from("leads").select("id", count).gte("created_at", weekAgo),
    sb.from("leads").select("id", count).eq("status", "new"),
    sb.from("leads").select("id", count).in("status", ["consulting", "quoted", "test_drive_booked", "won"]),
    sb.from("leads").select("id", count).or("status.eq.test_drive_booked,inquiry_type.eq.test_drive"),
    sb.from("leads").select("id, code, full_name, phone, inquiry_type, status, created_at, vehicle:vehicles(name)").order("created_at", { ascending: false }).limit(8),
    sb.rpc("lead_counts_by_vehicle"),
    sb.from("vehicles").select("id, name, price_verified, price_updated_at, cover_image, is_published").is("deleted_at", null).order("sort_order"),
    sb.from("promotions").select("id, title, end_at").eq("is_published", true).gt("end_at", nowIso).lt("end_at", inAWeek).order("end_at"),
  ]);

  const needsUpdate = (vehicles.data ?? []).filter((v) => !v.price_verified || isPriceStale(v.price_updated_at) || !v.cover_image);
  const counts = (byVehicle.data ?? []) as { vehicle_id: string | null; vehicle_name: string; total: number }[];
  const maxCount = Math.max(1, ...counts.map((c) => Number(c.total)));

  return (
    <>
      <PageHeader title="Dashboard" desc="Số liệu lấy trực tiếp từ cơ sở dữ liệu." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Xe đang hiển thị" value={published.count ?? 0} href="/admin/vehicles" />
        <Stat label="Lead mới (7 ngày)" value={newLeads7d.count ?? 0} href="/admin/leads" tone="brand" />
        <Stat label="Chưa liên hệ" value={uncontacted.count ?? 0} href="/admin/leads?status=new" tone={uncontacted.count ? "warn" : "default"} />
        <Stat label="Đã tư vấn" value={consulted.count ?? 0} href="/admin/leads?status=consulting" />
        <Stat label="Lái thử" value={testDrives.count ?? 0} href="/admin/leads?status=test_drive_booked" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Lead mới nhất" actions={<Link href="/admin/leads" className="text-sm font-semibold text-brand">Xem tất cả</Link>}>
          {latest.data?.length ? (
            <ul className="divide-y divide-silver">
              {(latest.data as unknown as Lead[]).map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-mist/60">
                    <div>
                      <p className="font-semibold">{l.full_name} <span className="font-normal text-steel tabular-nums">{l.phone}</span></p>
                      <p className="text-sm text-steel">{INQUIRY_LABELS[l.inquiry_type]} • {l.vehicle?.name ?? "Chưa chọn xe"} • {formatDate(l.created_at, true)}</p>
                    </div>
                    <Pill tone={l.status === "new" ? "amber" : l.status === "won" ? "green" : l.status === "lost" ? "red" : "blue"}>{LEAD_STATUS_LABELS[l.status as LeadStatus]}</Pill>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-steel">Chưa có lead nào. Lead từ biểu mẫu website sẽ xuất hiện ở đây.</p>}
        </Card>

        <Card title="Đăng ký theo mẫu xe">
          {counts.length ? (
            <ul className="space-y-3">
              {counts.map((c) => (
                <li key={c.vehicle_id ?? "none"}>
                  <div className="flex justify-between text-sm"><span>{c.vehicle_name}</span><span className="font-semibold tabular-nums">{c.total}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-mist"><div className="h-2 rounded-full bg-brand" style={{ width: `${(Number(c.total) / maxCount) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-steel">Chưa có dữ liệu.</p>}
        </Card>

        <Card title={`Xe cần cập nhật (${needsUpdate.length})`}>
          {needsUpdate.length ? (
            <ul className="divide-y divide-silver text-sm">
              {needsUpdate.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <Link href={`/admin/vehicles/${v.id}`} className="font-semibold hover:text-brand">{v.name}</Link>
                  <span className="flex flex-wrap gap-1">
                    {!v.price_verified ? <Pill tone="amber">Giá chưa xác minh</Pill> : isPriceStale(v.price_updated_at) ? <Pill tone="amber">Giá cũ</Pill> : null}
                    {!v.cover_image ? <Pill tone="red">Thiếu ảnh</Pill> : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-steel">Tất cả xe đã có giá xác minh và ảnh đại diện.</p>}
        </Card>

        <Card title="Ưu đãi sắp hết hạn (7 ngày)">
          {expiring.data?.length ? (
            <ul className="divide-y divide-silver text-sm">
              {expiring.data.map((p) => (
                <li key={p.id} className="flex justify-between gap-2 py-2.5">
                  <Link href={`/admin/promotions/${p.id}`} className="font-semibold hover:text-brand">{p.title}</Link>
                  <span className="text-steel">{formatDate(p.end_at, true)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-steel">Không có ưu đãi nào sắp hết hạn.</p>}
        </Card>
      </div>
    </>
  );
}
