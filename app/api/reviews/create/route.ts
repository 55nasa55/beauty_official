import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const admin = createSupabaseServiceRoleClient();

    const userRes = await supabase.auth.getUser();
    const user = userRes.data.user;

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to leave a review." },
        { status: 401 }
      );
    }

    const {
      productId,
      variantId,
      rating,
      body,
      images = [],
      subratings
    } = await req.json();

    if (!productId || !rating || !body) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (images.length > 3) {
      return NextResponse.json({ error: "Max 3 images allowed" }, { status: 400 });
    }

    // ───────────────────────────────────────────────
    // 1. Upload images (SERVICE ROLE CLIENT)
    // ───────────────────────────────────────────────
    const uploadedUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      const matches = img.match(/^data:(.*);base64,(.*)$/);
      if (!matches) continue;

      const contentType = matches[1];
      const base64 = matches[2];
      const buffer = Buffer.from(base64, "base64");

      const filePath = `${user.id}/${Date.now()}_${i}.png`;

      const { error: uploadError } = await admin.storage
        .from("review-images")
        .upload(filePath, buffer, {
          contentType,
          upsert: false
        });

      if (uploadError) {
        console.error("UPLOAD ERROR:", uploadError);
        continue;
      }

      const { data } = admin.storage
        .from("review-images")
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    // ───────────────────────────────────────────────
    // 2. CHECK PURCHASE (SERVICE ROLE CLIENT)
    // ───────────────────────────────────────────────
    const { data: orders, error: orderCheckError } = await admin
      .from("order_items")
      .select("id, orders!inner(user_id)")
      .eq("product_id", productId)
      .eq("orders.user_id", user.id)
      .limit(1);

    if (orderCheckError) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: "You must purchase this item before leaving a review." },
        { status: 403 }
      );
    }

    // ───────────────────────────────────────────────
    // 3. INSERT REVIEW (SERVICE ROLE CLIENT)
    // ───────────────────────────────────────────────
    const { data: review, error: reviewError } = await admin
      .from("reviews")
      .insert({
        product_id: productId,
        variant_id: variantId || null,
        user_id: user.id,
        rating,
        body,
        images: uploadedUrls
      })
      .select()
      .single();

    if (reviewError) {
      return NextResponse.json({ error: reviewError.message }, { status: 400 });
    }

    // ───────────────────────────────────────────────
    // 4. INSERT SUBRATINGS (SERVICE ROLE CLIENT)
    // ───────────────────────────────────────────────
    if (subratings && Object.keys(subratings).length > 0) {
      const rows = Object.entries(subratings).map(([subId, value]) => ({
        review_id: review.id,
        subrating_id: subId,
        value
      }));

      const { error: subError } = await admin
        .from("review_subratings")
        .insert(rows);

      if (subError) {
        return NextResponse.json({ error: subError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, review });
  } catch (err) {
    console.error("SERVER ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
