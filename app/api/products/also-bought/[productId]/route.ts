import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  const supabase = createSupabaseServiceRoleClient();
  const productId = params.productId;

  // 1️⃣ Find orders containing this product
  const { data: relevantOrders, error: ordersError } = await supabase
    .from("order_items")
    .select("order_id")
    .eq("product_id", productId);

  if (ordersError) {
    console.error("AlsoBought orders error:", ordersError);
    return NextResponse.json([], { status: 200 });
  }

  const orderIds = (relevantOrders || []).map(o => o.order_id);

  if (orderIds.length === 0) {
    return NextResponse.json([]);
  }

  // 2️⃣ Find other products in those orders
  const { data: otherItems, error: otherError } = await supabase
    .from("order_items")
    .select("product_id")
    .in("order_id", orderIds)
    .neq("product_id", productId);

  if (otherError) {
    console.error("AlsoBought other items error:", otherError);
    return NextResponse.json([], { status: 200 });
  }

  const freqMap: Record<string, number> = {};

  (otherItems || []).forEach(item => {
    freqMap[item.product_id] = (freqMap[item.product_id] || 0) + 1;
  });

  const topProductIds = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(entry => entry[0]);

  if (topProductIds.length === 0) {
    return NextResponse.json([]);
  }

  // 3️⃣ Fetch full product data and reviews
  const [productsResult, reviewsResult] = await Promise.all([
    supabase
      .from("products")
      .select("*, brand:brands(*), variants:product_variants(*)")
      .in("id", topProductIds)
      .eq("archived", false),
    supabase
      .from("reviews")
      .select("product_id, rating")
      .in("product_id", topProductIds),
  ]);

  if (productsResult.error) {
    console.error("AlsoBought products fetch error:", productsResult.error);
    return NextResponse.json([], { status: 200 });
  }

  const reviewsByProduct: Record<string, any[]> = {};
  (reviewsResult.data || []).forEach(review => {
    if (!reviewsByProduct[review.product_id]) {
      reviewsByProduct[review.product_id] = [];
    }
    reviewsByProduct[review.product_id].push(review);
  });

  const productsWithRatings = (productsResult.data || []).map((product: any) => {
    const reviews = reviewsByProduct[product.id] || [];
    const average_rating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : undefined;
    const review_count = reviews.length;

    return {
      ...product,
      average_rating,
      review_count,
    };
  });

  return NextResponse.json(productsWithRatings);
}
