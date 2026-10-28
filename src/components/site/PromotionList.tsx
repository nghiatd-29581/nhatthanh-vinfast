import Link from "next/link";
import { Countdown } from "./Countdown";
import { PROMO_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Promotion } from "@/lib/types";

export function PromotionList({ promotions, dark = false }: { promotions: Promotion[]; dark?: boolean }) {
  if (!promotions.length) {
    return (
      <div className={`rounded-[var(--radius-card)] p-8 md:p-10 ${dark ? "bg-ink-2 text-white" : "bg-mist"}`}>
        <p className="text-2xl font-bold tracking-[-0.02em]">Liên hệ để nhận ưu đãi mới nhất</p>
        <p className={`mt-2 max-w-xl ${dark ? "text-white/60" : "text-steel"}`}>
          Chương trình bán hàng thay đổi theo từng thời điểm. Nhật Thanh sẽ gửi bạn chính sách đang áp dụng cho đúng mẫu xe bạn quan tâm.
        </p>
        <Link href="/lien-he#dang-ky" className="btn btn-primary mt-6">Nhận thông tin ưu đãi</Link>
      </div>
    );
  }
  const now = Date.now();
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {promotions.map((p) => {
        const upcoming = p.start_at && new Date(p.start_at).getTime() > now;
        return (
          <li key={p.id} className={`flex flex-col rounded-[var(--radius-card)] border p-6 ${dark ? "border-white/10 bg-ink-2 text-white" : "border-silver bg-white"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip bg-brand/10 text-brand">{PROMO_TYPE_LABELS[p.promo_type]}</span>
              {upcoming ? <span className="chip bg-silver text-ink">Sắp áp dụng</span> : <span className="chip bg-emerald-600/10 text-emerald-700">Đang áp dụng</span>}
            </div>
            <h3 className="mt-4 text-xl font-bold tracking-[-0.02em]">{p.title}</h3>
            {p.description ? <p className={`mt-2 ${dark ? "text-white/70" : "text-steel"}`}>{p.description}</p> : null}
            <dl className={`mt-4 grid gap-1 text-sm ${dark ? "text-white/70" : "text-steel"}`}>
              <div><dt className="inline font-semibold">Mẫu xe: </dt><dd className="inline">{p.vehicle ? <Link className="underline" href={`/xe/${p.vehicle.slug}`}>{p.vehicle.name}</Link> : "Theo điều kiện chương trình"}</dd></div>
              <div><dt className="inline font-semibold">Thời gian: </dt><dd className="inline">{p.start_at ? formatDate(p.start_at) : "—"} đến {p.end_at ? formatDate(p.end_at) : "khi có thông báo mới"}</dd></div>
              {p.terms ? <div><dt className="inline font-semibold">Điều kiện: </dt><dd className="inline">{p.terms}</dd></div> : null}
            </dl>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
              {p.end_at && !upcoming ? <Countdown endAt={p.end_at} /> : <span />}
              <Link href="/lien-he#dang-ky" className="btn btn-primary btn-sm">Hỏi về ưu đãi này</Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
