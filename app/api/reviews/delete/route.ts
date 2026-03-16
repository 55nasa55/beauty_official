import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const userRes = await supabase.auth.getUser();
    const user = userRes.data.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId } = await req.json();

    if (!reviewId) {
      return NextResponse.json({ error: "Missing reviewId" }, { status: 400 });
    }

    const { error } = await supabase
      .from("reviews")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", reviewId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
