import { requireStaff } from "@/lib/auth";
import { Card, Flash, PageHeader } from "@/components/admin/ui";
import { importVehicles } from "@/app/admin/_actions/vehicles";

const EXAMPLE = `[
  {
    "name": "VinFast VF 7",
    "slug": "vinfast-vf7",
    "short_description": "Mô tả ngắn do bạn tự viết",
    "seats": 5,
    "range_km": 400,
    "range_standard": "NEDC",
    "starting_price": 799000000,
    "price_source": "Bảng giá chính thức ngày ...",
    "data_source": "https://vinfastauto.com/vn_vi/...",
    "specifications": { "Kích thước": { "Dài x Rộng x Cao": "..." } }
  }
]`;

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Nhập dữ liệu xe (JSON)" desc="Nhập hoặc cập nhật hàng loạt theo slug. Xe nhập vào luôn ở trạng thái nháp và giá chưa xác minh — bạn cần kiểm tra rồi xuất bản thủ công." />
      <Flash error={sp.error} />
      <Card>
        <form action={importVehicles} className="grid gap-4">
          <textarea name="json" rows={18} className="field font-mono text-xs" placeholder={EXAMPLE} required />
          <p className="text-xs text-steel">Số trong ví dụ chỉ minh họa định dạng, không phải dữ liệu thật. Mỗi lần tối đa 200 xe.</p>
          <div><button className="btn btn-primary">Nhập dữ liệu</button></div>
        </form>
      </Card>
    </>
  );
}
