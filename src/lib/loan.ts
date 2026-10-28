/**
 * Công cụ dự toán trả góp.
 * Hai phương pháp:
 *  - "annuity" (niên kim / trả đều): A = P * r / (1 - (1 + r)^-n), r = lãi suất năm / 12.
 *  - "declining" (dư nợ giảm dần): gốc cố định P/n mỗi tháng, lãi = dư nợ đầu kỳ * r.
 * Cả hai giả định lãi suất CỐ ĐỊNH suốt kỳ vay, không tính phí trả nợ trước hạn,
 * bảo hiểm khoản vay hay thay đổi lãi suất thả nổi của ngân hàng.
 */
export type LoanMethod = "annuity" | "declining";

export interface LoanInput {
  price: number;
  downPayment: number;
  termMonths: number;
  annualRatePercent: number;
  extraFees: number;
  method: LoanMethod;
}

export interface LoanRow { month: number; principal: number; interest: number; payment: number; balance: number }

export interface LoanResult {
  downPayment: number;
  loanAmount: number;
  firstPayment: number;
  lastPayment: number;
  monthlyPrincipal: number;
  firstMonthInterest: number;
  totalInterest: number;
  totalPaidToBank: number;
  totalCost: number;
  schedule: LoanRow[];
}

export function calculateLoan(input: LoanInput): LoanResult {
  const price = Math.max(0, input.price);
  const down = Math.min(Math.max(0, input.downPayment), price);
  const P = price - down;
  const n = Math.max(1, Math.round(input.termMonths));
  const r = Math.max(0, input.annualRatePercent) / 100 / 12;
  const schedule: LoanRow[] = [];
  let balance = P;

  if (input.method === "annuity") {
    const A = r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n));
    for (let m = 1; m <= n; m++) {
      const interest = balance * r;
      const principal = m === n ? balance : A - interest;
      balance = Math.max(0, balance - principal);
      schedule.push({ month: m, principal, interest, payment: principal + interest, balance });
    }
  } else {
    const principal = P / n;
    for (let m = 1; m <= n; m++) {
      const interest = balance * r;
      balance = Math.max(0, balance - principal);
      schedule.push({ month: m, principal, interest, payment: principal + interest, balance });
    }
  }

  const totalInterest = schedule.reduce((s, x) => s + x.interest, 0);
  const totalPaidToBank = P + totalInterest;
  return {
    downPayment: down,
    loanAmount: P,
    firstPayment: schedule[0]?.payment ?? 0,
    lastPayment: schedule[schedule.length - 1]?.payment ?? 0,
    monthlyPrincipal: schedule[0]?.principal ?? 0,
    firstMonthInterest: schedule[0]?.interest ?? 0,
    totalInterest,
    totalPaidToBank,
    totalCost: down + totalPaidToBank + Math.max(0, input.extraFees),
    schedule,
  };
}
