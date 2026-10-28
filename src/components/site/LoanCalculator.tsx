"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { calculateLoan, type LoanMethod } from "@/lib/loan";
import { formatVnd } from "@/lib/format";
import type { FinanceSettings } from "@/lib/types";

export interface CalcVehicle { id: string; name: string; price: number | null }

function parseMoney(s: string): number {
  const n = Number(s.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
const money = (n: number) => (n ? n.toLocaleString("vi-VN") : "");

export function LoanCalculator({ vehicles, finance, defaultVehicleId, compact = false }: { vehicles: CalcVehicle[]; finance: FinanceSettings; defaultVehicleId?: string; compact?: boolean }) {
  const initial = vehicles.find((v) => v.id === defaultVehicleId) ?? vehicles.find((v) => v.price) ?? null;
  const [vehicleId, setVehicleId] = useState(initial?.id ?? "");
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [downMode, setDownMode] = useState<"percent" | "amount">("percent");
  const [downPercent, setDownPercent] = useState(finance.default_down_payment_percent ?? 20);
  const [downAmount, setDownAmount] = useState(0);
  const [term, setTerm] = useState(60);
  const [rate, setRate] = useState<string>(finance.default_interest_rate != null ? String(finance.default_interest_rate) : "");
  const [method, setMethod] = useState<LoanMethod>("declining");
  const configuredFees = finance.extra_fees.reduce((s, f) => s + (f.amount || 0), 0);
  const [otherFees, setOtherFees] = useState(configuredFees);
  const [showSchedule, setShowSchedule] = useState(false);

  const down = downMode === "percent" ? Math.round((price * downPercent) / 100) : downAmount;
  const rateNum = Number(rate.replace(",", "."));
  const ready = price > 0 && rate.trim() !== "" && Number.isFinite(rateNum) && rateNum >= 0 && rateNum < 50;

  const result = useMemo(
    () => (ready ? calculateLoan({ price, downPayment: down, termMonths: term, annualRatePercent: rateNum, extraFees: otherFees, method }) : null),
    [ready, price, down, term, rateNum, otherFees, method],
  );

  const terms = Array.from({ length: Math.floor((finance.max_term_months || 96) / 12) }, (_, i) => (i + 1) * 12);

  return (
    <div className={`grid gap-8 ${compact ? "" : "lg:grid-cols-[1fr_1.05fr]"}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="calc-vehicle">Mẫu xe</label>
          <select
            id="calc-vehicle"
            className="field"
            value={vehicleId}
            onChange={(e) => {
              setVehicleId(e.target.value);
              const v = vehicles.find((x) => x.id === e.target.value);
              if (v?.price) setPrice(v.price);
            }}
          >
            <option value="">Tự nhập giá xe</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name}{v.price ? "" : " (chưa có giá xác minh)"}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="calc-price">Giá xe (₫)</label>
          <input id="calc-price" className="field tabular-nums" inputMode="numeric" value={money(price)} onChange={(e) => setPrice(parseMoney(e.target.value))} placeholder="Nhập giá xe theo báo giá" />
        </div>
        <div className="sm:col-span-2">
          <span className="label">Trả trước</span>
          <div className="flex gap-2">
            <div className="inline-flex rounded-full bg-mist p-1" role="group" aria-label="Cách nhập trả trước">
              {(["percent", "amount"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setDownMode(m)} aria-pressed={downMode === m} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${downMode === m ? "bg-white shadow-sm" : "text-steel"}`}>
                  {m === "percent" ? "%" : "₫"}
                </button>
              ))}
            </div>
            {downMode === "percent" ? (
              <input className="field tabular-nums" type="number" min={0} max={100} value={downPercent} onChange={(e) => setDownPercent(Math.min(100, Math.max(0, Number(e.target.value))))} aria-label="Tỷ lệ trả trước (%)" />
            ) : (
              <input className="field tabular-nums" inputMode="numeric" value={money(downAmount)} onChange={(e) => setDownAmount(parseMoney(e.target.value))} aria-label="Số tiền trả trước" />
            )}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="calc-term">Thời hạn vay</label>
          <select id="calc-term" className="field" value={term} onChange={(e) => setTerm(Number(e.target.value))}>
            {terms.map((t) => <option key={t} value={t}>{t} tháng ({t / 12} năm)</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="calc-rate">Lãi suất năm (%)</label>
          <input id="calc-rate" className="field tabular-nums" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Theo báo giá ngân hàng" />
          {finance.default_interest_rate != null && finance.interest_rate_source ? (
            <p className="mt-1 text-xs text-steel">Mặc định theo: {finance.interest_rate_source}</p>
          ) : null}
        </div>
        <div>
          <label className="label" htmlFor="calc-method">Cách tính</label>
          <select id="calc-method" className="field" value={method} onChange={(e) => setMethod(e.target.value as LoanMethod)}>
            <option value="declining">Dư nợ giảm dần</option>
            <option value="annuity">Trả đều hằng tháng (niên kim)</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="calc-fees">Chi phí đăng ký và phí khác (₫)</label>
          <input id="calc-fees" className="field tabular-nums" inputMode="numeric" value={money(otherFees)} onChange={(e) => setOtherFees(parseMoney(e.target.value))} placeholder="Nếu đã có báo giá" />
        </div>
        <p className="text-xs leading-relaxed text-steel sm:col-span-2">{finance.registration_fee_note}</p>
      </div>

      <div className="rounded-[var(--radius-card)] bg-ink p-6 text-white md:p-8" aria-live="polite">
        {result ? (
          <>
            <p className="text-sm text-white/60">{method === "annuity" ? "Trả mỗi tháng (cố định)" : "Tháng đầu tiên (giảm dần các tháng sau)"}</p>
            <p className="mt-1 text-4xl font-extrabold tracking-[-0.03em] tabular-nums md:text-5xl">{formatVnd(result.firstPayment)}</p>
            {method === "declining" ? <p className="mt-1 text-sm text-white/60 tabular-nums">Tháng cuối: {formatVnd(result.lastPayment)}</p> : null}
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-6 text-sm">
              <div><dt className="text-white/55">Trả trước</dt><dd className="mt-0.5 text-base font-semibold tabular-nums">{formatVnd(result.downPayment)}</dd></div>
              <div><dt className="text-white/55">Số tiền vay</dt><dd className="mt-0.5 text-base font-semibold tabular-nums">{formatVnd(result.loanAmount)}</dd></div>
              <div><dt className="text-white/55">Gốc tháng đầu</dt><dd className="mt-0.5 text-base font-semibold tabular-nums">{formatVnd(result.monthlyPrincipal)}</dd></div>
              <div><dt className="text-white/55">Lãi tháng đầu</dt><dd className="mt-0.5 text-base font-semibold tabular-nums">{formatVnd(result.firstMonthInterest)}</dd></div>
              <div><dt className="text-white/55">Tổng lãi ước tính</dt><dd className="mt-0.5 text-base font-semibold tabular-nums">{formatVnd(result.totalInterest)}</dd></div>
              <div><dt className="text-white/55">Tổng chi phí ước tính</dt><dd className="mt-0.5 text-base font-semibold tabular-nums">{formatVnd(result.totalCost)}</dd></div>
            </dl>
            <details className="mt-6 text-sm text-white/65">
              <summary className="cursor-pointer font-semibold text-white">Giả định của phép tính</summary>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                {method === "annuity" ? (
                  <li>Trả đều: A = P × r ÷ (1 − (1 + r)^−n), với r = lãi suất năm ÷ 12, n = số tháng.</li>
                ) : (
                  <li>Dư nợ giảm dần: gốc mỗi tháng = khoản vay ÷ số tháng; lãi = dư nợ đầu kỳ × lãi suất năm ÷ 12.</li>
                )}
                <li>Lãi suất giữ cố định suốt kỳ vay. Thực tế nhiều ngân hàng chỉ cố định một thời gian rồi thả nổi.</li>
                <li>Chưa gồm phí trả nợ trước hạn, bảo hiểm khoản vay và phí hồ sơ của ngân hàng.</li>
                <li>Tổng chi phí = trả trước + gốc + lãi + chi phí đăng ký và phí khác bạn nhập.</li>
                <li>Kết quả chỉ là ước tính, không phải lịch trả nợ thực tế hay cam kết cho vay.</li>
              </ul>
            </details>
            {!compact && (
              <div className="mt-4">
                <button type="button" className="text-sm font-semibold text-white underline underline-offset-4" onClick={() => setShowSchedule((s) => !s)} aria-expanded={showSchedule}>
                  {showSchedule ? "Ẩn lịch trả nợ" : "Xem lịch trả nợ dự kiến"}
                </button>
                {showSchedule && (
                  <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-white/10">
                    <table className="w-full text-right text-xs tabular-nums">
                      <thead className="sticky top-0 bg-ink-2 text-white/60">
                        <tr><th className="p-2 text-left">Tháng</th><th className="p-2">Gốc</th><th className="p-2">Lãi</th><th className="p-2">Phải trả</th><th className="p-2">Dư nợ</th></tr>
                      </thead>
                      <tbody>
                        {result.schedule.map((r) => (
                          <tr key={r.month} className="border-t border-white/5">
                            <td className="p-2 text-left">{r.month}</td>
                            <td className="p-2">{Math.round(r.principal).toLocaleString("vi-VN")}</td>
                            <td className="p-2">{Math.round(r.interest).toLocaleString("vi-VN")}</td>
                            <td className="p-2">{Math.round(r.payment).toLocaleString("vi-VN")}</td>
                            <td className="p-2">{Math.round(r.balance).toLocaleString("vi-VN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full min-h-[240px] flex-col justify-center">
            <p className="text-2xl font-bold tracking-[-0.02em]">Nhập giá xe và lãi suất để xem ước tính</p>
            <p className="mt-2 text-white/60">Lãi suất phụ thuộc ngân hàng và hồ sơ của bạn. Nếu chưa có con số cụ thể, Nhật Thanh có thể gửi bạn phương án từ các ngân hàng đang liên kết.</p>
          </div>
        )}
        <Link href="/lien-he?nhu-cau=finance#dang-ky" className="btn btn-primary mt-8 w-full">Nhận phương án tài chính phù hợp</Link>
      </div>
    </div>
  );
}
