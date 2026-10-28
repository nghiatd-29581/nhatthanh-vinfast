import type { Vehicle } from "./types";
import { PRICE_STALE_DAYS } from "./constants";

const vnd = new Intl.NumberFormat("vi-VN");

export function formatVnd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "Chưa cập nhật";
  return `${vnd.format(Math.round(n))} ₫`;
}

/** 1.234.000.000 → "1,23 tỷ"; 799.000.000 → "799 triệu" */
export function formatVndShort(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "Chưa cập nhật";
  if (n >= 1e9) return `${(n / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ`;
  if (n >= 1e6) return `${(n / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} triệu`;
  return formatVnd(n);
}

export function formatDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return "Chưa cập nhật";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Chưa cập nhật";
  return d.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** Giá công khai: chỉ trả về khi Admin đã xác minh */
export function publicPrice(v: Pick<Vehicle, "price_verified" | "starting_price" | "display_price">): { label: string; value: number | null } {
  if (!v.price_verified) return { label: "Liên hệ để nhận báo giá", value: null };
  if (v.display_price) return { label: v.display_price, value: v.starting_price };
  if (v.starting_price) return { label: `Từ ${formatVndShort(v.starting_price)}`, value: v.starting_price };
  return { label: "Liên hệ để nhận báo giá", value: null };
}

export function orDash(v: string | number | null | undefined, suffix = ""): string {
  if (v == null || v === "") return "Chưa cập nhật";
  return `${typeof v === "number" ? v.toLocaleString("vi-VN") : v}${suffix}`;
}

export function isPriceStale(updatedAt: string | null): boolean {
  if (!updatedAt) return true;
  return Date.now() - new Date(updatedAt).getTime() > PRICE_STALE_DAYS * 864e5;
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizePhone(raw: string): string {
  let p = raw.replace(/[^\d+]/g, "");
  if (p.startsWith("+84")) p = "0" + p.slice(3);
  else if (p.startsWith("84") && p.length === 11) p = "0" + p.slice(2);
  return p;
}

export function telHref(phone: string): string {
  const p = normalizePhone(phone);
  return `tel:${p.startsWith("0") ? "+84" + p.slice(1) : p}`;
}
