import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { getLegalText } from "@/lib/data";
import { DISCLAIMER } from "@/lib/constants";

export const revalidate = 300;
export const metadata: Metadata = { title: "Điều khoản sử dụng", alternates: { canonical: "/dieu-khoan-su-dung" } };

export default async function LegalPage() {
  const { body } = await getLegalText("terms");
  return (
    <>
      <PageIntro title="Điều khoản sử dụng" />
      <section className="container-x py-14 md:py-20">
        <div className="max-w-[68ch] whitespace-pre-line text-lg leading-relaxed">{body || "Nội dung đang được cập nhật."}</div>
        <p className="mt-10 max-w-[68ch] text-sm text-steel">{DISCLAIMER}</p>
      </section>
    </>
  );
}
