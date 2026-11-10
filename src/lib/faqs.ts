import type { Faq } from "./types";

/** Chuẩn hoá FAQ: chấp nhận cả {q, a} và {question, answer} */
export function normalizeFaqs(list: unknown): Faq[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((f) => {
      const o = (f ?? {}) as Record<string, unknown>;
      return { q: String(o.q ?? o.question ?? "").trim(), a: String(o.a ?? o.answer ?? "").trim() };
    })
    .filter((f) => f.q && f.a);
}

