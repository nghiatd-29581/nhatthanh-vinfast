import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Flash, PageHeader, Pill } from "@/components/admin/ui";
import { deletePromotion } from "@/app/admin/_actions/promotions";
import { formatDate } from "@/lib/format";
import { PROMO_TYPE_LABELS } from "@/lib/constants";
import type { Promotion } from "@/lib/types";

export default async function PromotionsAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const sb = await createSessionClient();
  const { data } = await sb.from("promotions").select("*, vehicle:vehicles(name, slug)").order("created_at", { ascending: false });
  const now = Date.now();
  return (
    <>
      <PageHeader title="Ưu đãi" desc="Chỉ đăng chương trình đã được xác nhận. Khi không có ưu đãi công khai, website hiển thị lời mời liên hệ." actions={<Link href="/admin/promotions/new" className="btn btn-primary btn-sm">Thêm ưu đãi</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="overflow-x-auto rounded-2xl border border-silver bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-mist text-steel"><tr><th className="p-3">Chương trình</th><th className="p-3">Loại</th><th className="p-3">Mẫu xe</th><th className="p-3">Thời gian</th><th className="p-3">Trạng thái</th><th className="p-3" /></tr></thead>
          <tbody>
            {((data ?? []) as Promotion[]).map((p) => {
              const ended = p.end_at && new Date(p.end_at).getTime() < now;
              return (
                <tr key={p.id} className="border-t border-silver">
                  <td className="p-3"><Link href={`/admin/promotions/${p.id}`} className="font-semibold hover:text-brand">{p.title}</Link></td>
                  <td className="p-3">{PROMO_TYPE_LABELS[p.promo_type]}</td>
                  <td className="p-3">{p.vehicle?.name ?? "Chung"}</td>
                  <td className="p-3 text-steel">{formatDate(p.start_at)} → {p.end_at ? formatDate(p.end_at) : "không thời hạn"}</td>
                  <td className="p-3">{ended ? <Pill tone="red">Hết hạn</Pill> : p.is_published ? <Pill tone="green">Công khai</Pill> : <Pill>Nháp</Pill>}</td>
                  <td className="p-3">
                    <form action={deletePromotion}><input type="hidden" name="id" value={p.id} /><button className="text-xs font-semibold text-signal">Xoá</button></form>
                  </td>
                </tr>
              );
            })}
            {!data?.length && <tr><td colSpan={6} className="p-8 text-center text-steel">Chưa có ưu đãi nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
