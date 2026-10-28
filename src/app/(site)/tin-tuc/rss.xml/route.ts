import { getAllPostsForIndex } from "@/lib/post-data";
import { getSiteData } from "@/lib/data";
import { postDescription } from "@/lib/posts";
import { SITE_URL } from "@/lib/env";

export const revalidate = 600;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const [posts, { contact }] = await Promise.all([getAllPostsForIndex(), getSiteData()]);
  const items = posts.slice(0, 50).map((p) => `
    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE_URL}/tin-tuc/${p.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/tin-tuc/${p.slug}</guid>
      <pubDate>${new Date(p.published_at ?? p.updated_at).toUTCString()}</pubDate>
      <description>${esc(postDescription(p))}</description>
    </item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(contact.display_name)} — Tin tức và kiến thức</title>
    <link>${SITE_URL}/tin-tuc</link>
    <description>Kiến thức ô tô điện và tin tức VinFast</description>
    <language>vi</language>${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" } });
}
