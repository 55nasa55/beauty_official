import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { productId, name } = await req.json();

  if (!productId || !name) {
    return NextResponse.json(
      { error: "Missing productId or name" },
      { status: 400 }
    );
  }

  const { data: existingSubs } = await supabase
    .from("product_subratings")
    .select("display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = existingSubs && existingSubs.length > 0
    ? existingSubs[0].display_order + 1
    : 1;

  const { error } = await supabase.from("product_subratings").insert({
    product_id: productId,
    name,
    display_order: nextOrder,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
