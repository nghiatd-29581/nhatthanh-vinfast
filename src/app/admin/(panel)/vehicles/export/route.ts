import { NextResponse } from "next/server";
import { getStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";

export async function GET() {
  if (!(await getStaff())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sb = await createSessionClient();
  const { data } = await sb.from("vehicles").select("*, variants:vehicle_variants(*), images:vehicle_images(*)").is("deleted_at", null).order("sort_order");
  return new NextResponse(JSON.stringify(data ?? [], null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="vehicles-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
