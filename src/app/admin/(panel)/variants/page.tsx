import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { ImportForm } from "@/components/admin/ImportForm";

const EXAMPLE = `[
  {
    "name": "VinFast VF 3",
    "slug": "vinfast-vf3",
    "seats": 4,
    "range_km": 215,
    "range_standard": "NEDC",
    "starting_price": 278000000,
    "price_source": "Tên bảng giá, ngày áp dụng",
    "faqs": [{ "question": "…", "answer": "…" }],
    "variants": [{ "name": "VF 3 Plus", "price": 296000000 }]
  }
]`;

export default async function ImportPage() {
  await requireStaff();
  return (
    <>
      <PageHeader title="Nhập dữ liệu xe (JSON)" desc="Có thể dùng trực tiếp file tải về từ nút “Xuất JSON”, chỉnh sửa rồi nhập lại."
        actions={<><a href="/admin/vehicles/export" className="btn btn-ghost btn-sm">Tải file Xuất JSON</a><Link href="/admin/vehicles" className="btn btn-ghost btn-sm">Danh sách xe</Link></>} />
      <ImportForm example={EXAMPLE} />
    </>
  );
}
