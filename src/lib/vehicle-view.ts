import type { Vehicle } from "./types";
import { normalizeColors } from "./colors";
import { orDash, publicPrice } from "./format";
import type { StageVehicle } from "@/components/site/VehicleStage";

export function quickSpecs(v: Vehicle) {
  return [
    { label: "Giá", value: publicPrice(v).label },
    { label: "Số chỗ ngồi", value: orDash(v.seats, " chỗ") },
    { label: "Quãng đường/lần sạc", value: v.range_km ? `${v.range_km.toLocaleString("vi-VN")} km${v.range_standard ? ` (${v.range_standard})` : ""}` : "Chưa cập nhật" },
    { label: "Công suất", value: orDash(v.power_text) },
    { label: "Kích thước (D x R x C)", value: orDash(v.dimensions) },
    { label: "Bảo hành", value: orDash(v.warranty_text) },
  ];
}

export function toStage(v: Vehicle): StageVehicle {
  return {
    name: v.name,
    cover_image: v.cover_image,
    colors: normalizeColors(v.colors),
    highlights: v.highlights ?? [],
    specifications: v.specifications ?? {},
    quickSpecs: quickSpecs(v),
  };
}
