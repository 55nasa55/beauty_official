import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/requireAdmin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(0, parseInt(searchParams.get("page") || "0", 10) || 0);
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10) || 10));
    const q = searchParams.get("q") || "";
    const brandId = searchParams.get("brand_id") || "";
    const categoryId = searchParams.get("category_id") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    const fromIdx = page * pageSize;
    const toIdx = fromIdx + pageSize - 1;

    let query = supabase
      .from("products")
      .select("id, created_at, name, slug, category_id, brand_id, tags, is_featured, is_best_seller, is_new", { count: "exact" })
      .order("created_at", { ascending: false });

    if (brandId) {
      query = query.eq("brand_id", brandId);
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (from) {
      query = query.gte("created_at", from);
    }

    if (to) {
      query = query.lte("created_at", to);
    }

    if (q.trim()) {
      query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
    }

    query = query.range(fromIdx, toIdx);

    const { data: products, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      products: products ?? [],
      page,
      pageSize,
      total: count ?? 0,
    });
  } catch (err: any) {
    console.error("Admin products list error:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
