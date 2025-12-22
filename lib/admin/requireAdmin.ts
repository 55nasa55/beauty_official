import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = createSupabaseServerClient();

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.email.toLowerCase();

  const { data: adminRow, error } = await supabase
    .from("admins")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error || !adminRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
