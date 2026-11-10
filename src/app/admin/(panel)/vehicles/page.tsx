import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { createSessionClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Flash, PageHeader, Pagination, Pill } from "@/components/admin/ui";
import { duplicateVehicle, purgeVehicles, vehicleQuickAction } from "@/app/admin/_actions/vehicles";
import { formatDate, isPriceStale, publicPrice } from "@/lib/format";
import { SALES_STATUS_LABELS } from "@/lib/constants";
import type { Vehicle } from "@/lib/types";

const PER = 20;

export default async function VehiclesAdmin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const sb = await createSessionClient();
  const { data: categories } = await sb.from("vehicle_categories").select("id, name").order("sort_order");

  let q = sb.from("vehicles").select("*, category:vehicle_categories(id, name, slug)", { count: "exact" }).order("sort_order").order("name");
  if (sp.view === "trash") q = q.not("deleted_at", "is", null);
  else q = q.is("deleted_at", null);
  if (sp.view === "published") q = q.eq("is_published", true);
  if (sp.view === "draft") q = q.eq("is_published", false);
  if (sp.cat) q = q.eq("category_id", sp.cat);
  if (sp.q) q = q.ilike("name", `%${sp.q.replace(/[%_]/g, "")}%`);
  const { data, count } = await q.range((page - 1) * PER, page * PER - 1);
  const vehicles = (data ?? []) as Vehicle[];

  const qs = (p: number) => {
    const u = new URLSearchParams(Object.entries({ ...sp, page: String(p) }).filter(([, v]) => v) as [string, string][]);
    return `/admin/vehicles?${u}`;
  };
  const back = qs(page);

  const act = (id: string, op: string, label: string, cls = "text-brand") => (
    <form action={vehicleQuickAction}>
      <input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={op} /><input type="hidden" name="back" value={back} />
      <button className={`text-xs font-semibold hover:underline ${cls}`}>{label}</button>
    </form>
  );

  return (
    <>
      <PageHeader title="Quản lý xe" desc="Thêm, sửa, ẩn, xuất bản và sắp xếp các mẫu xe."
        actions={<>
          <Link href="/admin/vehicles/import" className="btn btn-ghost btn-sm">Nhập JSON</Link>
          <a href="/admin/vehicles/export" className="btn btn-ghost btn-sm">Xuất JSON</a>
          <Link href="/admin/vehicles/new" className="btn btn-primary btn-sm">Thêm xe</Link>
        </>} />
      <Flash ok={sp.ok} error={sp.error} />
      {sp.view === "trash" && staff.role === "admin" && vehicles.length > 0 ? (
        <form action={purgeVehicles} className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-signal/30 bg-signal/5 p-4 text-sm">
          <input type="hidden" name="all" value="1" />
          <span>Xoá vĩnh viễn sẽ xoá luôn phiên bản, ảnh (kể cả file ảnh đã tải lên) của các xe trong thùng rác. Không thể hoàn tác.</span>
          <span className="flex items-center gap-3">
            <label className="flex items-center gap-2"><input type="checkbox" required className="size-4" /> Tôi hiểu</label>
            <button className="btn btn-sm bg-signal text-white">Xoá vĩnh viễn tất cả xe trong thùng rác</button>
          </span>
        </form>
      ) : null}

      <form className="mb-4 grid gap-2 rounded-2xl border border-silver bg-white p-3 sm:grid-cols-[1fr_180px_180px_auto]">
        <input name="q" defaultValue={sp.q} placeholder="Tìm theo tên xe" className="field" aria-label="Tìm kiếm" />
        <select name="view" defaultValue={sp.view ?? ""} className="field" aria-label="Trạng thái">
          <option value="">Tất cả (trừ đã xoá)</option>
          <option value="published">Đã xuất bản</option>
          <option value="draft">Bản nháp</option>
          <option value="trash">Đã xoá</option>
        </select>
        <select name="cat" defaultValue={sp.cat ?? ""} className="field" aria-label="Danh mục">
          <option value="">Mọi danh mục</option>
          {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn btn-primary btn-sm">Lọc</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-silver bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-mist text-steel">
            <tr><th className="p-3">Thứ tự</th><th className="p-3">Xe</th><th className="p-3">Giá công khai</th><th className="p-3">Trạng thái</th><th className="p-3">Cập nhật</th><th className="p-3">Thao tác</th></tr>
          </thead>
          <tbody>
            {vehicles.map((v) => {
              const missing = [!v.cover_image && "ảnh", !v.seats && "số chỗ", !v.short_description && "mô tả"].filter(Boolean);
              return (
                <tr key={v.id} className="border-t border-silver align-top">
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <span className="w-6 tabular-nums">{v.sort_order}</span>
                      <form action={vehicleQuickAction}><input type="hidden" name="id" value={v.id} /><input type="hidden" name="op" value="up" /><input type="hidden" name="back" value={back} /><button aria-label="Lên"><ArrowUp className="size-4 text-steel" /></button></form>
                      <form action={vehicleQuickAction}><input type="hidden" name="id" value={v.id} /><input type="hidden" name="op" value="down" /><input type="hidden" name="back" value={back} /><button aria-label="Xuống"><ArrowDown className="size-4 text-steel" /></button></form>
                    </div>
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/vehicles/${v.id}`} className="font-semibold hover:text-brand">{v.name}</Link>
                    <p className="text-xs text-steel">/xe/{v.slug} • {v.category?.name ?? "Chưa phân loại"}</p>
                    {missing.length ? <p className="mt-1 text-xs text-amber-700">Thiếu: {missing.join(", ")}</p> : null}
                  </td>
                  <td className="p-3">
                    <p>{publicPrice(v).label}</p>
                    {!v.price_verified ? <Pill tone="amber">Chưa xác minh</Pill> : isPriceStale(v.price_updated_at) ? <Pill tone="amber">Giá đã cũ</Pill> : <Pill tone="green">Đã xác minh</Pill>}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {v.deleted_at ? <Pill tone="red">Đã xoá</Pill> : v.is_published ? <Pill tone="green">Xuất bản</Pill> : <Pill>Nháp</Pill>}
                      {v.is_featured ? <Pill tone="blue">Nổi bật</Pill> : null}
                      {v.show_on_landing ? <Pill>Trang chủ</Pill> : null}
                      <Pill>{SALES_STATUS_LABELS[v.sales_status]}</Pill>
                    </div>
                  </td>
                  <td className="p-3 text-steel">{formatDate(v.updated_at, true)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <Link href={`/admin/vehicles/${v.id}`} className="text-xs font-semibold text-brand hover:underline">Sửa</Link>
                      {v.deleted_at ? <>
                        {act(v.id, "restore", "Khôi phục")}
                        {staff.role === "admin" ? (
                          <form action={purgeVehicles}><input type="hidden" name="id" value={v.id} /><button className="text-xs font-semibold text-signal hover:underline">Xoá vĩnh viễn</button></form>
                        ) : null}
                      </> : <>
                        {v.is_published ? act(v.id, "unpublish", "Ẩn") : act(v.id, "publish", "Xuất bản")}
                        {v.is_featured ? act(v.id, "unfeature", "Bỏ nổi bật") : act(v.id, "feature", "Nổi bật")}
                        {v.show_on_landing ? act(v.id, "landing_off", "Ẩn khỏi trang chủ") : act(v.id, "landing_on", "Hiện trang chủ")}
                        <form action={duplicateVehicle}><input type="hidden" name="id" value={v.id} /><button className="text-xs font-semibold text-brand hover:underline">Nhân bản</button></form>
                        {act(v.id, "delete", "Xoá", "text-signal")}
                      </>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!vehicles.length && <tr><td colSpan={6} className="p-8 text-center text-steel">Không có xe nào khớp bộ lọc.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={count ?? 0} perPage={PER} base={qs} />
    </>
  );
}
