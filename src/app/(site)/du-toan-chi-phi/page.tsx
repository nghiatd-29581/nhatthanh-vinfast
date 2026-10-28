import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { LoanCalculator } from "@/components/site/LoanCalculator";
import { getAllVariants, getSiteData, getVehicles } from "@/lib/data";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Dự toán chi phí và trả góp ô tô VinFast",
  description: "Ước tính số tiền trả trước, khoản vay và tiền trả hằng tháng khi mua ô tô điện VinFast, theo phương pháp dư nợ giảm dần hoặc trả đều.",
  alternates: { canonical: "/du-toan-chi-phi" },
};

export default async function CostPage() {
  const [vehicles, variants, site] = await Promise.all([getVehicles(), getAllVariants(), getSiteData()]);
  const options = vehicles.flatMap((v) => {
    const vs = variants.filter((x) => x.vehicle_id === v.id);
    return vs.length
      ? vs.map((x) => ({ id: x.id, name: `${v.name} ${x.name}`, price: x.price_verified ? x.price : null }))
      : [{ id: v.id, name: v.name, price: v.price_verified ? v.starting_price : null }];
  });
  return (
    <>
      <PageIntro title="Dự toán chi phí" lede="Nhập giá xe, mức trả trước, thời hạn và lãi suất để ước tính khoản trả hằng tháng. Kết quả không thay thế báo giá chính thức của ngân hàng." />
      <section className="container-x py-14 md:py-20">
        <LoanCalculator vehicles={options} finance={site.finance} />
        {site.finance.extra_fees.length ? (
          <div className="mt-12 max-w-2xl">
            <h2 className="text-xl font-bold">Các khoản phí đã tính sẵn</h2>
            <ul className="mt-3 divide-y divide-silver border-y border-silver text-sm">
              {site.finance.extra_fees.map((f) => (
                <li key={f.name} className="flex justify-between gap-4 py-3">
                  <span>{f.name}{f.note ? <span className="block text-steel">{f.note}</span> : null}</span>
                  <span className="font-semibold tabular-nums">{f.amount.toLocaleString("vi-VN")} ₫</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </>
  );
}
