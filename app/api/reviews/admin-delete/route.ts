import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient
} from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const supabaseAdmin = createSupabaseServiceRoleClient();

    const { reviewId } = await req.json();

    if (!reviewId) {
      return NextResponse.json(
        { error: "Missing reviewId" },
        { status: 400 }
      );
    }

    // 1. Get the authenticated user
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Validate admin using email (correct schema)
    const { data: adminCheck, error: adminError } = await supabase
      .from("admins")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (adminError) {
      return NextResponse.json(
        { error: "Admin check failed" },
        { status: 500 }
      );
    }

    if (!adminCheck) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 3. Soft-delete the review using service role (bypass RLS)
    const { error: updateError } = await supabaseAdmin
      .from("reviews")
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq("id", reviewId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ADMIN DELETE REVIEW ERROR", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}