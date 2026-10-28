import Link from "next/link";
import { Fragment } from "react";
import { createSessionClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { PageHeader, Pill } from "@/components/admin/ui";
import { formatDate, formatVnd, isPriceStale } from "@/lib/format";
import { PRICE_STALE_DAYS } from "@/lib/constants";

export default async function PricingPage() {
  await requireStaff();
  const sb = await createSessionClient();
  const { data } = await sb
    .from("vehicles")
    .select("id, name, listed_price, starting_price, rolling_price_estimate, price_verified, price_updated_at, price_source, vehicle_variants(id, name, price, price_verified)")
    .is("deleted_at", null)
    .order("sort_order");
  return (
    <>
      <PageHeader title="Giá xe" desc={`Giá chỉ hiển thị công khai sau khi được xác minh và ghi nguồn. Giá quá ${PRICE_STALE_DAYS} ngày sẽ được đánh dấu cần kiểm tra.`} />
      <div className="overflow-x-auto rounded-2xl border border-silver bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-mist text-steel">
            <tr><th className="p-3">Xe / phiên bản</th><th className="p-3">Niêm yết</th><th className="p-3">Bán tham khảo</th><th className="p-3">Lăn bánh ước tính</th><th className="p-3">Trạng thái</th><th className="p-3">Cập nhật / nguồn</th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((v) => (
              <Fragment key={v.id}>
                <tr className="border-t border-silver">
                  <td className="p-3"><Link href={`/admin/vehicles/${v.id}?tab=price`} className="font-semibold hover:text-brand">{v.name}</Link></td>
                  <td className="p-3 tabular-nums">{formatVnd(v.listed_price)}</td>
                  <td className="p-3 tabular-nums">{formatVnd(v.starting_price)}</td>
                  <td className="p-3 tabular-nums">{formatVnd(v.rolling_price_estimate)}</td>
                  <td className="p-3">{!v.price_verified ? <Pill tone="amber">Chờ xác minh</Pill> : isPriceStale(v.price_updated_at) ? <Pill tone="amber">Cần kiểm tra lại</Pill> : <Pill tone="green">Công khai</Pill>}</td>
                  <td className="p-3 text-steel">{formatDate(v.price_updated_at)}<br /><span className="text-xs">{v.price_source ?? "Chưa ghi nguồn"}</span></td>
                </tr>
                {v.vehicle_variants?.map((x) => (
                  <tr key={x.id} className="border-t border-silver/60 bg-mist/40">
                    <td className="p-3 pl-8"><Link href={`/admin/vehicles/${v.id}?tab=variants`} className="hover:text-brand">↳ {x.name}</Link></td>
                    <td className="p-3" /><td className="p-3 tabular-nums">{formatVnd(x.price)}</td><td className="p-3" />
                    <td className="p-3">{x.price_verified ? <Pill tone="green">Công khai</Pill> : <Pill tone="amber">Chờ xác minh</Pill>}</td><td className="p-3" />
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
