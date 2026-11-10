"use server";
import { revalidatePath } from "next/cache";
import { assertStaff } from "@/lib/auth";
import { importVehicle, parseLooseJson, VEHICLE_FIELDS, vehicleSlug, type ImportVehicle } from "@/lib/vehicle-import";

export interface ImportRow { name: string; slug: string; action: "create" | "update"; variants: number; images: number }
export interface ImportReport {
  status: "idle" | "checked" | "done" | "error";
  errors: string[];
  warnings: string[];
  rows: ImportRow[];
  summary?: string;
}

const MAX_ITEMS = 200;

export async function importVehiclesAction(_prev: ImportReport, formData: FormData): Promise<ImportReport> {
  const { supabase } = await assertStaff();
  const mode = formData.get("intent") === "import" ? "import" : "check";
  const keepStatus = formData.get("keep_status") === "on";
  const report: ImportReport = { status: "error", errors: [], warnings: [], rows: [] };

  // 1. Đọc JSON
  const parsed = parseLooseJson(String(formData.get("json") ?? ""));
  if (!parsed.ok) return { ...report, errors: [parsed.error] };
  const rawItems = parsed.value;
  if (rawItems.length > MAX_ITEMS) return { ...report, errors: [`Tối đa ${MAX_ITEMS} xe mỗi lần, file có ${rawItems.length} xe.`] };

  // 2. Kiểm tra từng xe, gom TẤT CẢ lỗi kèm vị trí để dễ sửa
  const items: { raw: Record<string, unknown>; v: ImportVehicle; slug: string }[] = [];
  rawItems.forEach((raw, i) => {
    const label = `Xe #${i + 1}${raw && typeof raw === "object" && "name" in raw ? ` (${String((raw as { name: unknown }).name)})` : ""}`;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      report.errors.push(`${label}: không phải một object { … }.`);
      return;
    }
    const r = importVehicle.safeParse(raw);
    if (!r.success) {
      for (const issue of r.error.issues.slice(0, 8)) {
        report.errors.push(`${label} → ${issue.path.join(".") || "(gốc)"}: ${issue.message}`);
      }
      return;
    }
    const slug = vehicleSlug(r.data);
    if (!slug) report.errors.push(`${label}: không tạo được slug từ tên xe.`);
    else items.push({ raw: raw as Record<string, unknown>, v: r.data, slug });
  });
  const seen = new Map<string, number>();
  items.forEach((it) => seen.set(it.slug, (seen.get(it.slug) ?? 0) + 1));
  for (const [slug, n] of seen) if (n > 1) report.errors.push(`Slug "${slug}" xuất hiện ${n} lần trong file.`);
  if (report.errors.length) return report;

  // 3. Đối chiếu với dữ liệu hiện có
  const [{ data: cats }, { data: existing }] = await Promise.all([
    supabase.from("vehicle_categories").select("id, slug"),
    supabase.from("vehicles").select("id, slug").in("slug", items.map((i) => i.slug)),
  ]);
  const catIds = new Set((cats ?? []).map((c) => c.id));
  const catBySlug = new Map((cats ?? []).map((c) => [c.slug, c.id]));
  const existingBySlug = new Map((existing ?? []).map((e) => [e.slug, e.id]));

  for (const { raw, v, slug } of items) {
    if (v.category_id && !catIds.has(v.category_id)) report.warnings.push(`${v.name}: category_id không tồn tại → để “Chưa phân loại”.`);
    if (v.category_slug && !catBySlug.has(v.category_slug)) report.warnings.push(`${v.name}: category_slug "${v.category_slug}" không tồn tại.`);
    if (keepStatus && v.price_verified && !v.price_source) report.warnings.push(`${v.name}: có price_verified = true nhưng thiếu price_source → giá sẽ KHÔNG được công khai.`);
    if (keepStatus && v.price_verified && v.starting_price == null && !v.display_price) report.warnings.push(`${v.name}: đánh dấu xác minh nhưng chưa có giá.`);
    report.rows.push({
      name: v.name,
      slug,
      action: existingBySlug.has(slug) ? "update" : "create",
      variants: Array.isArray(raw.variants) ? raw.variants.length : 0,
      images: Array.isArray(raw.images) ? raw.images.length : 0,
    });
  }

  if (mode === "check") {
    const c = report.rows.filter((r) => r.action === "create").length;
    return { ...report, status: "checked", summary: `File hợp lệ: ${c} xe mới, ${report.rows.length - c} xe cập nhật. Bấm “Nhập dữ liệu” để ghi vào hệ thống.` };
  }

  // 4. Ghi dữ liệu — chỉ cập nhật những trường CÓ trong file, không xoá trường khác
  let ok = 0;
  for (const { raw, v, slug } of items) {
    const payload: Record<string, unknown> = {};
    for (const f of VEHICLE_FIELDS) if (f in raw) payload[f] = (v as Record<string, unknown>)[f];
    if ("cover_image" in payload && !payload.cover_image) payload.cover_image = null;
    if (v.category_slug) payload.category_id = catBySlug.get(v.category_slug) ?? null;
    else if ("category_id" in payload && v.category_id && !catIds.has(v.category_id)) payload.category_id = null;
    if ("badges" in payload) payload.badges = (v.badges ?? []).filter((b) => ["featured", "new", "promo"].includes(b));
    for (const f of ["is_featured", "show_on_landing"] as const) if (f in payload && payload[f] == null) delete payload[f];
    if ("sales_status" in payload && !payload.sales_status) delete payload.sales_status;
    if ("sort_order" in payload && payload.sort_order == null) delete payload.sort_order;

    const id0 = existingBySlug.get(slug);
    if (keepStatus) {
      if ("is_published" in raw && v.is_published != null) payload.is_published = v.is_published;
      const verified = !!v.price_verified && !!v.price_source;
      payload.price_verified = verified;
      if (verified) payload.price_updated_at = v.price_updated_at && !Number.isNaN(Date.parse(v.price_updated_at)) ? v.price_updated_at : new Date().toISOString();
    } else {
      // Mặc định an toàn: xe mới là nháp; giá từ file chờ duyệt lại
      if (!id0) payload.is_published = false;
      if (["listed_price", "starting_price", "display_price", "rolling_price_estimate"].some((f) => f in raw)) payload.price_verified = false;
    }

    const res = id0
      ? await supabase.from("vehicles").update(payload).eq("id", id0).select("id").single()
      : await supabase.from("vehicles").insert({ ...payload, slug }).select("id").single();
    if (res.error || !res.data) {
      report.errors.push(`${v.name}: không ghi được (${res.error?.message ?? "lỗi không xác định"}).`);
      continue;
    }
    const vehicleId = res.data.id as string;

    // Phiên bản: khớp theo id, nếu không có thì theo tên
    if (v.variants?.length) {
      const { data: cur } = await supabase.from("vehicle_variants").select("id, name").eq("vehicle_id", vehicleId);
      for (const [i, x] of v.variants.entries()) {
        const match = (cur ?? []).find((c) => (x.id && c.id === x.id) || c.name.trim().toLowerCase() === x.name.toLowerCase());
        const row = {
          vehicle_id: vehicleId,
          name: x.name,
          price: x.price,
          price_verified: keepStatus ? !!x.price_verified : false,
          specifications: x.specifications,
          features: x.features,
          colors: x.colors,
          sales_status: x.sales_status ?? "contact",
          sort_order: x.sort_order ?? i + 1,
          is_active: x.is_active ?? true,
        };
        const r = match
          ? await supabase.from("vehicle_variants").update(row).eq("id", match.id)
          : await supabase.from("vehicle_variants").insert(row);
        if (r.error) report.errors.push(`${v.name} / phiên bản ${x.name}: ${r.error.message}`);
      }
    }

    // Ảnh: khớp theo id hoặc URL
    if (v.images?.length) {
      const { data: cur } = await supabase.from("vehicle_images").select("id, image_url").eq("vehicle_id", vehicleId);
      for (const [i, img] of v.images.entries()) {
        const match = (cur ?? []).find((c) => (img.id && c.id === img.id) || c.image_url === img.image_url);
        const row = {
          vehicle_id: vehicleId,
          image_url: img.image_url,
          storage_path: img.storage_path ?? null,
          alt_text: img.alt_text ?? "",
          image_type: img.image_type ?? "exterior",
          color_name: img.color_name ?? null,
          sort_order: img.sort_order ?? i + 1,
          is_cover: img.is_cover ?? false,
          is_active: img.is_active ?? true,
          usage_rights_note: img.usage_rights_note ?? null,
          source_url: img.source_url ?? null,
        };
        const r = match ? await supabase.from("vehicle_images").update(row).eq("id", match.id) : await supabase.from("vehicle_images").insert(row);
        if (r.error) report.errors.push(`${v.name} / ảnh ${i + 1}: ${r.error.message}`);
      }
    }
    ok++;
  }

  revalidatePath("/", "layout");
  return {
    ...report,
    status: report.errors.length ? "error" : "done",
    summary: `Đã ghi ${ok}/${items.length} xe.${keepStatus ? " Trạng thái xuất bản và xác minh giá lấy theo file." : " Xe mới ở trạng thái nháp; giá trong file đang chờ duyệt trong tab Giá."}`,
  };
}
