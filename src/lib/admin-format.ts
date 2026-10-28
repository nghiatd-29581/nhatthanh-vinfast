import type { ColorOption, Faq, Highlight, SpecGroups } from "./types";

/*
 * Chuyển đổi giữa dữ liệu JSON và dạng văn bản dễ nhập cho người không biết lập trình.
 *  - Thông số:   "Nhóm > Tên thông số: Giá trị"   (mỗi dòng một thông số)
 *  - Màu:        "Tên màu | #hex"
 *  - Nổi bật:    "Tiêu đề | Nội dung"
 *  - FAQ:        "Câu hỏi | Trả lời"
 *  - Trang bị:   mỗi dòng một trang bị
 */

export function specsToText(specs: SpecGroups | null | undefined): string {
  if (!specs) return "";
  return Object.entries(specs)
    .flatMap(([g, rows]) => Object.entries(rows ?? {}).map(([k, v]) => `${g} > ${k}: ${v}`))
    .join("\n");
}

export function textToSpecs(text: string): SpecGroups {
  const out: SpecGroups = {};
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const left = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    const [group, key] = left.includes(">") ? left.split(">").map((s) => s.trim()) : ["Thông số chung", left];
    if (!key) continue;
    (out[group] ??= {})[key] = value;
  }
  return out;
}

function pairsToText<T>(arr: T[] | null | undefined, a: keyof T, b: keyof T): string {
  return (arr ?? []).map((x) => `${String(x[a] ?? "")} | ${String(x[b] ?? "")}`).join("\n");
}
function textToPairs(text: string): [string, string][] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf("|");
      return i < 0 ? [l, ""] : [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    });
}

export const colorsToText = (c: ColorOption[] | null | undefined) => pairsToText(c, "name", "hex");
export const textToColors = (t: string): ColorOption[] =>
  textToPairs(t).map(([name, hex]) => ({ name, hex: /^#[0-9a-f]{3,8}$/i.test(hex) ? hex : "#cccccc" }));

export const highlightsToText = (h: Highlight[] | null | undefined) => pairsToText(h, "title", "text");
export const textToHighlights = (t: string): Highlight[] => textToPairs(t).map(([title, text]) => ({ title, text }));

export const faqsToText = (f: Faq[] | null | undefined) => pairsToText(f, "q", "a");
export const textToFaqs = (t: string): Faq[] => textToPairs(t).filter(([, a]) => a).map(([q, a]) => ({ q, a }));

export const listToText = (l: string[] | null | undefined) => (l ?? []).join("\n");
export const textToList = (t: string) => t.split("\n").map((s) => s.trim()).filter(Boolean);

/** "1.234.000.000" hoặc "1234000000" → number | null */
export function parseMoneyInput(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").replace(/[^\d]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parseIntInput(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

export const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};
export const bool = (v: FormDataEntryValue | null) => v === "on" || v === "true";

/** datetime-local (giờ VN) → ISO */
export function localToIso(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(`${s}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
/** ISO → giá trị cho input datetime-local theo giờ VN */
export function isoToLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 7 * 3600e3);
  return d.toISOString().slice(0, 16);
}
