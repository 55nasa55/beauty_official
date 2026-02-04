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

    const {
      productId,
      variantId,
      rating,
      body,
      images,
      subratings
    } = await req.json();

    if (!productId || !rating || !body) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (images && images.length > 3) {
      return NextResponse.json({ error: "Max 3 images allowed" }, { status: 400 });
    }

    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        product_id: productId,
        variant_id: variantId || null,
        user_id: user.id,
        rating,
        body,
        images: images ?? []
      })
      .select()
      .single();

    if (reviewError) {
      return NextResponse.json({ error: reviewError.message }, { status: 400 });
    }

    if (subratings && Object.keys(subratings).length > 0) {
      const rows = Object.entries(subratings).map(([subId, value]) => ({
        review_id: review.id,
        subrating_id: subId,
        value
      }));

      const { error: subError } = await supabase
        .from("review_subratings")
        .insert(rows);

      if (subError) {
        return NextResponse.json({ error: subError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, review });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
