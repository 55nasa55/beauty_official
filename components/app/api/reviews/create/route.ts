import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    console.log(">>> /api/reviews/create called");
    const supabase = createSupabaseServerClient();
    const admin = createSupabaseServiceRoleClient();

    const userRes = await supabase.auth.getUser();
    const user = userRes.data.user;

    console.log("USER:", user);

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

    const uploadedUrls: string[] = [];

    console.log("IMAGE COUNT:", images.length);

    // 🔎 DEBUG: List available buckets
    const { data: buckets, error: bucketError } = await admin.storage.listBuckets();
    console.log("AVAILABLE BUCKETS:", buckets);
    console.error("BUCKET LIST ERROR:", bucketError);

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      console.log("RAW IMAGE STRING:", typeof img, img?.slice?.(0, 50));

      const matches = img.match(/^data:(.*);base64,(.*)$/);
      if (!matches) continue;

      const contentType = matches[1];
      const base64 = matches[2];
      const buffer = Buffer.from(base64, "base64");

      const filePath = `${user.id}/${Date.now()}_${i}.png`;

      const { error: uploadError } = await admin.storage
        .from("review_images")
        .upload(filePath, buffer, {
          contentType,
          upsert: false
        });

      if (uploadError) {
        console.error("UPLOAD ERROR:", uploadError);
        continue;
      }

      const { data } = admin.storage
        .from("review_images")
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    console.log(">>> CHECKING PURCHASE for product:", productId, "user:", user.id);

    const { data: orders, error: orderCheckError } = await admin
      .from("order_items")
      .select("id, product_id, orders!inner(user_id)")
      .eq("product_id", productId)
      .eq("orders.user_id", user.id)
      .limit(1);

    console.log("PURCHASE CHECK RESULT:", orders);
    console.error("PURCHASE CHECK ERROR:", orderCheckError);

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: "You must purchase this item before leaving a review." },
        { status: 403 }
      );
    }

    console.log("UPLOADED URLS BEFORE INSERT:", uploadedUrls);
    console.log(">>> INSERTING REVIEW");

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

    console.log("REVIEW INSERT RESULT:", review);
    console.error("REVIEW INSERT ERROR:", reviewError);

    if (reviewError) {
      return NextResponse.json({ error: reviewError.message }, { status: 400 });
    }

    if (subratings && Object.keys(subratings).length > 0) {
      const rows = Object.entries(subratings).map(([subId, value]) => ({
        review_id: review.id,
        subrating_id: subId,
        value
      }));

      console.log(">>> INSERTING SUBRATINGS:", subratings);

      const { error: subError } = await admin.from("review_subratings").insert(rows);

      console.error("SUBRATINGS INSERT ERROR:", subError);
    }

    return NextResponse.json({ success: true, review });

  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
