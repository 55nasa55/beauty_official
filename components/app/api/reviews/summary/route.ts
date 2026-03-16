import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    // Aggregate main rating
    const { data: ratingStats, error: ratingError } = await supabase
      .from("reviews")
      .select("id, rating")
      .eq("product_id", productId)
      .is("deleted_at", null);

    if (ratingError) {
      return NextResponse.json({ error: ratingError.message }, { status: 400 });
    }

    const totalReviews = ratingStats.length;
    const avgRating =
      totalReviews > 0
        ? ratingStats.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : null;

    // Rating breakdown
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingStats.forEach(r => breakdown[r.rating as 1 | 2 | 3 | 4 | 5]++);

    // Subrating averages - fetch subratings for reviews
    const reviewIds = ratingStats.map(r => r.id);

    let subratingAverages: Array<{ id: string; name: string; average: number | null }> = [];

    if (reviewIds.length > 0) {
      const { data: subRatings, error: subRatingsError } = await supabase
        .from("review_subratings")
        .select(
          `
          value,
          subrating_id,
          product_subratings:subrating_id ( name )
        `
        )
        .in("review_id", reviewIds);

      if (subRatingsError) {
        return NextResponse.json({ error: subRatingsError.message }, { status: 400 });
      }

      // Aggregate subrating values
      const subratingMap: Record<
        string,
        { name: string; sum: number; count: number }
      > = {};

      if (subRatings) {
        subRatings.forEach(row => {
          const subId = row.subrating_id;
          const name = (row.product_subratings as any)?.name;

          if (!subratingMap[subId]) {
            subratingMap[subId] = { name, sum: 0, count: 0 };
          }

          subratingMap[subId].sum += row.value;
          subratingMap[subId].count++;
        });

        subratingAverages = Object.entries(subratingMap).map(
          ([subId, { name, sum, count }]) => ({
            id: subId,
            name,
            average: count > 0 ? sum / count : null
          })
        );
      }
    }

    return NextResponse.json({
      averageRating: avgRating,
      totalReviews,
      breakdown,
      subratingAverages
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
