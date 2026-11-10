import type { CSSProperties } from "react";
import type { ColorOption, ColorType } from "./types";

const HEX = /^#[0-9a-f]{6}$|^#[0-9a-f]{3}$/i;

export function isHex(v: unknown): v is string {
  return typeof v === "string" && HEX.test(v);
}

/** Chuẩn hoá danh sách màu (dữ liệu cũ không có type → ngoại thất) */
export function normalizeColors(list: unknown): ColorOption[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((c) => {
      const o = (c ?? {}) as Record<string, unknown>;
      const t = String(o.type ?? "").toLowerCase();
      const type: ColorType = ["interior", "noi-that", "nội thất", "noi that"].includes(t) ? "interior" : "exterior";
      return {
        name: String(o.name ?? "").trim(),
        hex: isHex(o.hex) ? o.hex : "#cccccc",
        hex2: isHex(o.hex2) ? o.hex2 : null,
        type,
      };
    })
    .filter((c) => c.name);
}

export const exteriorColors = (l: unknown) => normalizeColors(l).filter((c) => c.type !== "interior");
export const interiorColors = (l: unknown) => normalizeColors(l).filter((c) => c.type === "interior");

/** Nền ô màu: một màu, hoặc chia đôi chéo khi phối 2 màu */
export function swatchStyle(c: Pick<ColorOption, "hex" | "hex2">): CSSProperties {
  return c.hex2 ? { background: `linear-gradient(135deg, ${c.hex} 0 50%, ${c.hex2} 50% 100%)` } : { background: c.hex };
}
