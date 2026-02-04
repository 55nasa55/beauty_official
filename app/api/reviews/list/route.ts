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
          variant_id,
          user_id,
          review_subratings (
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

    return NextResponse.json({ reviews: data });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
