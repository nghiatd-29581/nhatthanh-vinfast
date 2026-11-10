"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertStaff } from "@/lib/auth";
import { slugify } from "@/lib/format";
import {
  bool, parseIntInput, parseMoneyInput, str, textToColors, textToFaqs, textToHighlights, textToList, textToSpecs,
} from "@/lib/admin-format";

function revalidatePublic(slug?: string) {
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/xe/${slug}`);
}

const SALES = ["selling", "coming_soon", "paused", "contact"] as const;

// ---------- Thông tin xe ----------
export async function saveVehicle(formData: FormData) {
  const { supabase } = await assertStaff();
  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  if (!name) redirect(`/admin/vehicles/${id ?? "new"}?error=${encodeURIComponent("Vui lòng nhập tên xe")}`);
  const slug = slugify(str(formData.get("slug")) ?? name!);
  const sales = String(formData.get("sales_status"));

  const payload = {
    name,
    slug,
    category_id: str(formData.get("category_id")),
    short_description: str(formData.get("short_description")),
    description: str(formData.get("description")),
    body_type: str(formData.get("body_type")),
    seats: parseIntInput(formData.get("seats")),
    range_km: parseIntInput(formData.get("range_km")),
    range_standard: str(formData.get("range_standard")),
    dimensions: str(formData.get("dimensions")),
    power_text: str(formData.get("power_text")),
    warranty_text: str(formData.get("warranty_text")),
    specifications: textToSpecs(String(formData.get("specifications") ?? "")),
    highlights: textToHighlights(String(formData.get("highlights") ?? "")),
    faqs: textToFaqs(String(formData.get("faqs") ?? "")),
    colors: textToColors(String(formData.get("colors") ?? "")),
    cover_image: str(formData.get("cover_image")),
    sales_status: (SALES as readonly string[]).includes(sales) ? sales : "contact",
    badges: formData.getAll("badges").map(String).filter((b) => ["featured", "new", "promo"].includes(b)),
    is_featured: bool(formData.get("is_featured")),
    show_on_landing: bool(formData.get("show_on_landing")),
    is_published: formData.get("intent") === "publish" ? true : formData.get("intent") === "draft" ? false : bool(formData.get("is_published")),
    sort_order: parseIntInput(formData.get("sort_order")) ?? 0,
    data_source: str(formData.get("data_source")),
    seo_title: str(formData.get("seo_title")),
    seo_description: str(formData.get("seo_description")),
  };

  const q = id
    ? supabase.from("vehicles").update(payload).eq("id", id).select("id").single()
    : supabase.from("vehicles").insert(payload).select("id").single();
  const { data, error } = await q;
  if (error || !data) {
    const msg = error?.code === "23505" ? "Slug đã tồn tại, hãy chọn slug khác" : "Không lưu được dữ liệu xe";
    redirect(`/admin/vehicles/${id ?? "new"}?error=${encodeURIComponent(msg)}`);
  }
  revalidatePublic(slug);
  redirect(`/admin/vehicles/${data.id}?ok=${encodeURIComponent("Đã lưu thông tin xe")}`);
}

// ---------- Giá (tách riêng để duyệt trước khi công khai) ----------
export async function saveVehiclePrice(formData: FormData) {
  const { supabase } = await assertStaff();
  const id = String(formData.get("id"));
  const verified = bool(formData.get("price_verified"));
  const source = str(formData.get("price_source"));
  if (verified && !source) {
    redirect(`/admin/vehicles/${id}?tab=price&error=${encodeURIComponent("Cần ghi nguồn xác minh trước khi công khai giá")}`);
  }
  const { data: before } = await supabase.from("vehicles").select("starting_price, listed_price, slug").eq("id", id).single();
  const starting = parseMoneyInput(formData.get("starting_price"));
  const listed = parseMoneyInput(formData.get("listed_price"));
  const priceChanged = !before || before.starting_price !== starting || before.listed_price !== listed;
  const { error } = await supabase
    .from("vehicles")
    .update({
      listed_price: listed,
      starting_price: starting,
      rolling_price_estimate: parseMoneyInput(formData.get("rolling_price_estimate")),
      display_price: str(formData.get("display_price")),
      price_note: str(formData.get("price_note")),
      price_source: source,
      price_verified: verified,
      ...(priceChanged || verified ? { price_updated_at: new Date().toISOString() } : {}),
    })
    .eq("id", id);
  if (error) redirect(`/admin/vehicles/${id}?tab=price&error=${encodeURIComponent("Không lưu được giá")}`);
  revalidatePublic(before?.slug);
  redirect(`/admin/vehicles/${id}?tab=price&ok=${encodeURIComponent(verified ? "Đã lưu và công khai giá" : "Đã lưu giá (chưa công khai)")}`);
}

// ---------- Thao tác nhanh ----------
export async function vehicleQuickAction(formData: FormData) {
  const { supabase } = await assertStaff();
  const id = String(formData.get("id"));
  const op = String(formData.get("op"));
  const back = String(formData.get("back") ?? "/admin/vehicles");
  let patch: Record<string, unknown> | null = null;
  switch (op) {
    case "publish": patch = { is_published: true }; break;
    case "unpublish": patch = { is_published: false }; break;
    case "feature": patch = { is_featured: true }; break;
    case "unfeature": patch = { is_featured: false }; break;
    case "landing_on": patch = { show_on_landing: true }; break;
    case "landing_off": patch = { show_on_landing: false }; break;
    case "delete": patch = { deleted_at: new Date().toISOString(), is_published: false }; break;
    case "restore": patch = { deleted_at: null }; break;
    case "up":
    case "down": {
      const { data: v } = await supabase.from("vehicles").select("sort_order").eq("id", id).single();
      if (v) patch = { sort_order: v.sort_order + (op === "up" ? -1 : 1) };
      break;
    }
  }
  if (patch) await supabase.from("vehicles").update(patch).eq("id", id);
  revalidatePublic();
  redirect(back);
}

export async function duplicateVehicle(formData: FormData) {
  const { supabase } = await assertStaff();
  const id = String(formData.get("id"));
  const { data: v } = await supabase.from("vehicles").select("*").eq("id", id).single();
  if (!v) redirect("/admin/vehicles?error=" + encodeURIComponent("Không tìm thấy xe"));
  const { id: _omit, created_at: _c, updated_at: _u, ...rest } = v;
  const copy = { ...rest, name: `${v.name} (bản sao)`, slug: `${v.slug}-ban-sao-${Date.now().toString(36)}`, is_published: false, price_verified: false };
  const { data: created, error } = await supabase.from("vehicles").insert(copy).select("id").single();
  if (error || !created) redirect("/admin/vehicles?error=" + encodeURIComponent("Không nhân bản được"));
  const { data: variants } = await supabase.from("vehicle_variants").select("*").eq("vehicle_id", id);
  if (variants?.length) {
    await supabase.from("vehicle_variants").insert(
      variants.map(({ id: _i, created_at: _a, updated_at: _b, ...x }) => ({ ...x, vehicle_id: created.id, price_verified: false })),
    );
  }
  redirect(`/admin/vehicles/${created.id}?ok=${encodeURIComponent("Đã nhân bản — bản sao đang ở trạng thái nháp")}`);
}

// ---------- Phiên bản ----------
export async function saveVariant(formData: FormData) {
  const { supabase } = await assertStaff();
  const vehicleId = String(formData.get("vehicle_id"));
  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  const back = `/admin/vehicles/${vehicleId}?tab=variants`;
  if (!name) redirect(`${back}&error=${encodeURIComponent("Vui lòng nhập tên phiên bản")}`);
  const sales = String(formData.get("sales_status"));
  const payload = {
    vehicle_id: vehicleId,
    name,
    price: parseMoneyInput(formData.get("price")),
    price_verified: bool(formData.get("price_verified")),
    specifications: textToSpecs(String(formData.get("specifications") ?? "")),
    features: textToList(String(formData.get("features") ?? "")),
    colors: textToColors(String(formData.get("colors") ?? "")),
    sales_status: (SALES as readonly string[]).includes(sales) ? sales : "contact",
    sort_order: parseIntInput(formData.get("sort_order")) ?? 0,
    is_active: bool(formData.get("is_active")),
  };
  const { error } = id
    ? await supabase.from("vehicle_variants").update(payload).eq("id", id)
    : await supabase.from("vehicle_variants").insert(payload);
  if (error) redirect(`${back}&error=${encodeURIComponent("Không lưu được phiên bản")}`);
  revalidatePublic();
  redirect(`${back}&ok=${encodeURIComponent("Đã lưu phiên bản")}`);
}

export async function deleteVariant(formData: FormData) {
  const { supabase } = await assertStaff();
  const vehicleId = String(formData.get("vehicle_id"));
  await supabase.from("vehicle_variants").delete().eq("id", String(formData.get("id")));
  revalidatePublic();
  redirect(`/admin/vehicles/${vehicleId}?tab=variants&ok=${encodeURIComponent("Đã xoá phiên bản")}`);
}
