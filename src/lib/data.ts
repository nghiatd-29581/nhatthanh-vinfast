import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { SAMPLE_VEHICLES } from "@/lib/sample-data";
import { DEFAULT_ABOUT, DEFAULT_CONTACT, DEFAULT_FINANCE, DEFAULT_HERO, DEFAULT_NOTICES, DEFAULT_SEO } from "@/lib/constants";
import type { AboutContent, Category, HeroContent, Promotion, SiteData, Variant, Vehicle, VehicleImage } from "@/lib/types";

/*
 * Lớp đọc dữ liệu PUBLIC. Dùng client ẩn danh → RLS chỉ trả về dữ liệu đã xuất bản.
 * Nếu Supabase chưa cấu hình hoặc lỗi kết nối, trả về dữ liệu mẫu/mặc định để trang không bị hỏng.
 */

const VEHICLE_SELECT = "*, category:vehicle_categories(id, name, slug)";

export const getSiteData = cache(async (): Promise<SiteData> => {
  const fallback: SiteData = { contact: DEFAULT_CONTACT, finance: DEFAULT_FINANCE, seo: DEFAULT_SEO, notices: DEFAULT_NOTICES };
  if (!isSupabaseConfigured()) return fallback;
  try {
    const { data, error } = await createPublicClient().from("site_settings").select("key, value");
    if (error || !data) return fallback;
    const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
    return {
      contact: { ...DEFAULT_CONTACT, ...(map.contact ?? {}) },
      finance: { ...DEFAULT_FINANCE, ...(map.finance ?? {}) },
      seo: { ...DEFAULT_SEO, ...(map.seo ?? {}) },
      notices: { ...DEFAULT_NOTICES, ...(map.notices ?? {}) },
    };
  } catch {
    return fallback;
  }
});

async function getContent<T>(key: string, fallback: T): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    const { data } = await createPublicClient().from("site_content").select("content").eq("section_key", key).eq("is_published", true).maybeSingle();
    return data?.content ? { ...fallback, ...(data.content as T) } : fallback;
  } catch {
    return fallback;
  }
}

export const getHero = cache(() => getContent<HeroContent>("hero", DEFAULT_HERO));
export const getAbout = cache(() => getContent<AboutContent>("about", DEFAULT_ABOUT));
export const getLegalText = cache((key: "privacy" | "terms") => getContent<{ body: string }>(key, { body: "" }));

export const getVehicles = cache(async (): Promise<Vehicle[]> => {
  if (!isSupabaseConfigured()) return SAMPLE_VEHICLES;
  try {
    const { data, error } = await createPublicClient()
      .from("vehicles")
      .select(VEHICLE_SELECT)
      .eq("is_published", true)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Vehicle[];
  } catch {
    return [];
  }
});

export const getVehicleBySlug = cache(async (slug: string): Promise<Vehicle | null> => {
  if (!isSupabaseConfigured()) return SAMPLE_VEHICLES.find((v) => v.slug === slug) ?? null;
  try {
    const { data } = await createPublicClient()
      .from("vehicles")
      .select(VEHICLE_SELECT)
      .eq("slug", slug)
      .eq("is_published", true)
      .is("deleted_at", null)
      .maybeSingle();
    return (data as Vehicle) ?? null;
  } catch {
    return null;
  }
});

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await createPublicClient().from("vehicle_categories").select("*").eq("is_active", true).order("sort_order");
    return (data ?? []) as Category[];
  } catch {
    return [];
  }
});

export const getVariants = cache(async (vehicleId: string): Promise<Variant[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await createPublicClient().from("vehicle_variants").select("*").eq("vehicle_id", vehicleId).eq("is_active", true).order("sort_order");
    return (data ?? []) as Variant[];
  } catch {
    return [];
  }
});

export const getAllVariants = cache(async (): Promise<Variant[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await createPublicClient().from("vehicle_variants").select("*").eq("is_active", true).order("sort_order");
    return (data ?? []) as Variant[];
  } catch {
    return [];
  }
});

export const getImages = cache(async (vehicleId: string): Promise<VehicleImage[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await createPublicClient().from("vehicle_images").select("*").eq("vehicle_id", vehicleId).eq("is_active", true).order("sort_order");
    return (data ?? []) as VehicleImage[];
  } catch {
    return [];
  }
});

/** Ưu đãi đang/ sắp diễn ra (chưa hết hạn) */
export const getPromotions = cache(async (): Promise<Promotion[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const nowIso = new Date().toISOString();
    const { data } = await createPublicClient()
      .from("promotions")
      .select("*, vehicle:vehicles(name, slug)")
      .eq("is_published", true)
      .or(`end_at.is.null,end_at.gt.${nowIso}`)
      .order("end_at", { ascending: true, nullsFirst: false });
    return (data ?? []) as Promotion[];
  } catch {
    return [];
  }
});

export const getImagesForVehicles = cache(async (ids: string[]): Promise<VehicleImage[]> => {
  if (!isSupabaseConfigured() || ids.length === 0) return [];
  try {
    const { data } = await createPublicClient().from("vehicle_images").select("*").in("vehicle_id", ids).eq("is_active", true).order("sort_order");
    return (data ?? []) as VehicleImage[];
  } catch {
    return [];
  }
});
