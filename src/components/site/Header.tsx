import { getSiteData } from "@/lib/data";
import { telHref } from "@/lib/format";
import { HeaderNav } from "./HeaderNav";

export async function Header() {
  const { contact } = await getSiteData();
  return <HeaderNav name={contact.display_name} hotline={contact.hotline} tel={telHref(contact.hotline_tel || contact.hotline)} />;
}
