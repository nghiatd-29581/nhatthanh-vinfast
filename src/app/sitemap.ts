import type { MetadataRoute } from "next";
import { getVehicles } from "@/lib/data";
import { SITE_URL } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vehicles = await getVehicles();
  const statics = ["", "/xe", "/so-sanh", "/du-toan-chi-phi", "/uu-dai", "/lien-he"].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  return [
    ...statics,
    ...vehicles.map((v) => ({ url: `${SITE_URL}/xe/${v.slug}`, lastModified: v.updated_at, changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}
