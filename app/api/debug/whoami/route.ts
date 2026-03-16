import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data } = await supabase.auth.getUser();
  return NextResponse.json({ email: data.user?.email ?? null });
}
