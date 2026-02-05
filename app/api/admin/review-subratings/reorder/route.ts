import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { productId, id, direction } = await req.json();

  if (!productId || !id || !direction) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data } = await supabase
    .from("product_subratings")
    .select("*")
    .eq("product_id", productId)
    .order("display_order");

  const list = data || [];
  const idx = list.findIndex((s) => s.id === id);

  if (idx === -1) {
    return NextResponse.json({ success: true });
  }

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;

  if (swapIdx < 0 || swapIdx >= list.length) {
    return NextResponse.json({ success: true });
  }

  const a = list[idx];
  const b = list[swapIdx];

  await supabase
    .from("product_subratings")
    .update({ display_order: b.display_order })
    .eq("id", a.id);

  await supabase
    .from("product_subratings")
    .update({ display_order: a.display_order })
    .eq("id", b.id);

  return NextResponse.json({ success: true });
}
