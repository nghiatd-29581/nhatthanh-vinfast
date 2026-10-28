import type { MetadataRoute } from "next";
import { getVehicles } from "@/lib/data";
import { getAllPostsForIndex, getPostCategories } from "@/lib/post-data";
import { SITE_URL } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [vehicles, posts, categories] = await Promise.all([getVehicles(), getAllPostsForIndex(), getPostCategories()]);
  const statics = ["", "/xe", "/so-sanh", "/du-toan-chi-phi", "/uu-dai", "/tin-tuc", "/lien-he"].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: (p === "/tin-tuc" ? "daily" : "weekly") as "daily" | "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
  return [
    ...statics,
    ...vehicles.map((v) => ({ url: `${SITE_URL}/xe/${v.slug}`, lastModified: v.updated_at, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...categories.map((c) => ({ url: `${SITE_URL}/tin-tuc/chuyen-muc/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...posts.map((p) => ({ url: `${SITE_URL}/tin-tuc/${p.slug}`, lastModified: p.updated_at, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
