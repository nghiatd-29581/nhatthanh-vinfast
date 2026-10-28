import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { PageHeader, Pill } from "@/components/admin/ui";

/** Tổng quan phiên bản và ảnh của từng xe — dẫn tới tab tương ứng để chỉnh sửa */
export default async function VariantsOverview() {
  await requireStaff();
  const sb = await createSessionClient();
  const { data } = await sb.from("vehicles").select("id, name, cover_image, vehicle_variants(id), vehicle_images(id, is_active)").is("deleted_at", null).order("sort_order");
  return (
    <>
      <PageHeader title="Phiên bản và hình ảnh" desc="Chọn xe để quản lý phiên bản, giá theo phiên bản, gallery và ảnh theo màu." />
      <div className="overflow-x-auto rounded-2xl border border-silver bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-mist text-steel"><tr><th className="p-3">Xe</th><th className="p-3">Phiên bản</th><th className="p-3">Ảnh</th><th className="p-3">Ảnh đại diện</th><th className="p-3" /></tr></thead>
          <tbody>
            {(data ?? []).map((v) => (
              <tr key={v.id} className="border-t border-silver">
                <td className="p-3 font-semibold">{v.name}</td>
                <td className="p-3 tabular-nums">{v.vehicle_variants?.length ?? 0}</td>
                <td className="p-3 tabular-nums">{v.vehicle_images?.filter((i) => i.is_active).length ?? 0}</td>
                <td className="p-3">{v.cover_image ? <Pill tone="green">Có</Pill> : <Pill tone="red">Thiếu</Pill>}</td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <Link href={`/admin/vehicles/${v.id}?tab=variants`} className="text-xs font-semibold text-brand">Phiên bản</Link>
                    <Link href={`/admin/vehicles/${v.id}?tab=images`} className="text-xs font-semibold text-brand">Hình ảnh</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
