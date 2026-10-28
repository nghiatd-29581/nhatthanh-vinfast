import type { Metadata } from "next";
import { getCategories, getSiteData, getVehicles } from "@/lib/data";
import { VehicleCard } from "@/components/site/VehicleCard";
import { VehicleExplorer } from "@/components/site/VehicleExplorer";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Các dòng xe ô tô điện VinFast",
  description: "Danh sách các mẫu ô tô điện VinFast: giá tham khảo, số chỗ, quãng đường mỗi lần sạc. Nhận báo giá cùng Nhật Thanh.",
  alternates: { canonical: "/xe" },
};

export default async function VehiclesPage() {
  const [vehicles, categories, site] = await Promise.all([getVehicles(), getCategories(), getSiteData()]);
  const cards = Object.fromEntries(vehicles.map((v, i) => [v.id, <VehicleCard key={v.id} v={v} priority={i < 3} />]));
  return (
    <>
      <div className="bg-ink pb-14 pt-32 text-white md:pb-20 md:pt-40">
        <div className="container-x">
          <h1 className="display text-[clamp(2.6rem,1.6rem+4vw,5rem)]">Các dòng xe</h1>
          <p className="lede mt-4 !text-white/60">{site.notices.price_notice}</p>
        </div>
      </div>
      <section className="container-x py-14 md:py-20">
        <VehicleExplorer vehicles={vehicles} categories={categories} cards={cards} />
      </section>
    </>
  );
}
