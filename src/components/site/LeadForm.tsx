"use client";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitLead, type LeadState } from "@/app/actions/lead";
import { INQUIRY_LABELS } from "@/lib/constants";
import type { InquiryType } from "@/lib/types";

interface Props {
  vehicles: { id: string; name: string }[];
  defaultVehicleId?: string;
  defaultInquiry?: InquiryType;
  sourcePage: string;
  dark?: boolean;
}

export function LeadForm({ vehicles, defaultVehicleId, defaultInquiry = "quote", sourcePage, dark }: Props) {
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, { status: "idle" });
  const [startedAt, setStartedAt] = useState(0);
  useEffect(() => setStartedAt(Date.now()), []);

  const fe = state.fieldErrors ?? {};
  const field = `field ${dark ? "field-dark" : ""}`;
  const err = (k: keyof typeof fe) =>
    fe[k] ? (
      <p id={`${k}-err`} className="mt-1.5 text-sm text-signal" role="alert">
        {fe[k]}
      </p>
    ) : null;

  if (state.status === "success") {
    return (
      <div className={`rounded-[var(--radius-card)] p-8 ${dark ? "bg-ink-2 text-white" : "bg-mist"}`} role="status">
        <CheckCircle2 className="size-10 text-brand" aria-hidden />
        <p className="mt-4 text-2xl font-bold tracking-[-0.02em]">{state.message}</p>
        {state.code ? <p className={`mt-2 ${dark ? "text-white/60" : "text-steel"}`}>Mã yêu cầu: <span className="font-semibold tabular-nums">{state.code}</span></p> : null}
      </div>
    );
  }

  return (
    <form action={action} noValidate className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="source_page" value={sourcePage} />
      <input type="hidden" name="started_at" value={startedAt} />
      <div className="hidden" aria-hidden>
        <label>
          Website công ty <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="full_name" className="label">Họ và tên</label>
        <input id="full_name" name="full_name" className={field} autoComplete="name" required aria-invalid={!!fe.full_name} aria-describedby={fe.full_name ? "full_name-err" : undefined} />
        {err("full_name")}
      </div>
      <div>
        <label htmlFor="phone" className="label">Số điện thoại</label>
        <input id="phone" name="phone" type="tel" inputMode="tel" className={field} autoComplete="tel" required aria-invalid={!!fe.phone} aria-describedby={fe.phone ? "phone-err" : undefined} />
        {err("phone")}
      </div>
      <div>
        <label htmlFor="vehicle_id" className="label">Mẫu xe quan tâm</label>
        <select id="vehicle_id" name="vehicle_id" className={field} defaultValue={defaultVehicleId ?? ""}>
          <option value="">Chưa chọn / cần tư vấn</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="inquiry_type" className="label">Nhu cầu</label>
        <select id="inquiry_type" name="inquiry_type" className={field} defaultValue={defaultInquiry}>
          {(Object.keys(INQUIRY_LABELS) as InquiryType[]).map((k) => (
            <option key={k} value={k}>{INQUIRY_LABELS[k]}</option>
          ))}
        </select>
        {err("inquiry_type")}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="preferred_contact_at" className="label">Thời gian liên hệ mong muốn</label>
        <input id="preferred_contact_at" name="preferred_contact_at" className={field} placeholder="Ví dụ: sau 18h các ngày trong tuần" maxLength={100} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="message" className="label">Nội dung bổ sung</label>
        <textarea id="message" name="message" rows={3} maxLength={1000} className={`${field} min-h-[96px]`} />
        {err("message")}
      </div>
      <div className="sm:col-span-2">
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input type="checkbox" name="consent" className="mt-1 size-5 shrink-0 accent-[var(--color-brand)]" required aria-invalid={!!fe.consent} />
          <span className={dark ? "text-white/75" : "text-steel"}>
            Tôi đồng ý để Nhật Thanh liên hệ tư vấn và xử lý dữ liệu theo{" "}
            <Link href="/chinh-sach-quyen-rieng-tu" className="underline underline-offset-2" target="_blank">
              chính sách quyền riêng tư
            </Link>
            .
          </span>
        </label>
        {err("consent")}
      </div>

      {state.status === "error" && state.message ? (
        <p className="rounded-xl bg-signal/10 px-4 py-3 text-sm font-medium text-signal sm:col-span-2" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? "Đang gửi…" : "Gửi yêu cầu tư vấn"}
        </button>
      </div>
    </form>
  );
}
