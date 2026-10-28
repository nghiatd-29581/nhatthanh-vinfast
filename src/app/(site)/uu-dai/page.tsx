import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { PromotionList } from "@/components/site/PromotionList";
import { getPromotions, getSiteData } from "@/lib/data";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Ưu đãi mua ô tô VinFast",
  description: "Chương trình ưu đãi, hỗ trợ tài chính và trả góp khi mua ô tô điện VinFast, cập nhật bởi Nhật Thanh.",
  alternates: { canonical: "/uu-dai" },
};

export default async function PromotionsPage() {
  const [promotions, site] = await Promise.all([getPromotions(), getSiteData()]);
  return (
    <>
      <PageIntro title="Ưu đãi" lede={site.notices.price_notice} />
      <section className="container-x py-14 md:py-20"><PromotionList promotions={promotions} /></section>
    </>
  );
}
