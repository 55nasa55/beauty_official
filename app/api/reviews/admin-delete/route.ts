import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { reviewId } = await req.json();

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminCheck } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminCheck)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase
    .from("reviews")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", reviewId);

  if (error) {
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
