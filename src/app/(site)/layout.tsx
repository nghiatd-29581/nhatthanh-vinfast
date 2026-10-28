import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { DesktopContactDock, FloatingBar } from "@/components/site/FloatingBar";
import { getSiteData } from "@/lib/data";
import { telHref } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/env";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { contact } = await getSiteData();
  const tel = telHref(contact.hotline_tel || contact.hotline);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
        Bỏ qua tới nội dung
      </a>
      {!isSupabaseConfigured() && (
        <div className="fixed left-3 top-[72px] z-[55] rounded-full bg-signal px-3 py-1 text-[11px] font-semibold text-white shadow-lg md:bottom-6 md:left-6 md:top-auto md:text-xs" role="note">
          Demo: chưa kết nối Supabase, dữ liệu mẫu
        </div>
      )}
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <FloatingBar tel={tel} zaloUrl={contact.zalo_url} />
      <DesktopContactDock tel={tel} hotline={contact.hotline} zaloUrl={contact.zalo_url} />
    </>
  );
}
