import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return NextResponse.json({ email: data.user?.email ?? null });
}
