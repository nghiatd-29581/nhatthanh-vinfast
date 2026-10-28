import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { CompareTool } from "@/components/site/CompareTool";
import { getAllVariants, getVehicles } from "@/lib/data";

export const metadata: Metadata = {
  title: "So sánh các dòng xe VinFast",
  description: "So sánh tối đa 3 mẫu ô tô điện VinFast theo giá, kích thước, quãng đường mỗi lần sạc, công suất và trang bị.",
  alternates: { canonical: "/so-sanh" },
};

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ xe?: string }> }) {
  const [{ xe }, vehicles, variants] = await Promise.all([searchParams, getVehicles(), getAllVariants()]);
  const initial = (xe ?? "").split(",").filter(Boolean);
  return (
    <>
      <PageIntro title="So sánh xe" lede="Chọn tối đa 3 mẫu để đặt cạnh nhau. Chỉ hiển thị dữ liệu đã xác minh." />
      <section className="container-x py-14 md:py-20">
        <CompareTool vehicles={vehicles} variants={variants} initial={initial.length ? initial : vehicles.slice(0, 2).map((v) => v.slug)} />
      </section>
    </>
  );
}
