import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const {
      productId,
      sort = "newest",
      page = 1,
      limit = 10
    } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    let query = supabase
      .from("reviews")
      .select(
        `
          id,
          rating,
          body,
          images,
          created_at,
          product_id,
          variant_id,
          user_id,
          user_email,
          review_subratings (
            id,
            subrating_id,
            value
          )
        `
      )
      .eq("product_id", productId)
      .is("deleted_at", null);

    if (sort === "newest") query = query.order("created_at", { ascending: false });
    if (sort === "oldest") query = query.order("created_at", { ascending: true });
    if (sort === "highest_rating") query = query.order("rating", { ascending: false });
    if (sort === "photos") query = query.not("images", "is", null);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Normalize undefined/null fields
    const safe = (data ?? []).map(r => ({
      ...r,
      user_email: r.user_email ?? null,
      body: r.body ?? "",
      images: Array.isArray(r.images) ? r.images : [],
      created_at: r.created_at ?? new Date().toISOString(),
      review_subratings: r.review_subratings ?? []
    }));

    return NextResponse.json({ reviews: safe });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
