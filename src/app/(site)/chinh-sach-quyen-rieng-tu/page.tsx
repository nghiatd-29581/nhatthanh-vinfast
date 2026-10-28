import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { getLegalText } from "@/lib/data";
import { DISCLAIMER } from "@/lib/constants";

export const revalidate = 300;
export const metadata: Metadata = { title: "Chính sách quyền riêng tư", alternates: { canonical: "/chinh-sach-quyen-rieng-tu" } };

export default async function LegalPage() {
  const { body } = await getLegalText("privacy");
  return (
    <>
      <PageIntro title="Chính sách quyền riêng tư" />
      <section className="container-x py-14 md:py-20">
        <div className="max-w-[68ch] whitespace-pre-line text-lg leading-relaxed">{body || "Nội dung đang được cập nhật."}</div>
        <p className="mt-10 max-w-[68ch] text-sm text-steel">{DISCLAIMER}</p>
      </section>
    </>
  );
}
