import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServiceRoleClient();

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const search = url.searchParams.get("search") || "";
    const filter = url.searchParams.get("filter") || "all";
    const sort = url.searchParams.get("sort") || "newest";

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from("contact_messages")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`
      );
    }

    if (filter === "unread") {
      query = query.eq("read", false);
    } else if (filter === "read") {
      query = query.eq("read", true);
    } else if (filter === "30days") {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", cutoff);
    }

    if (sort === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(start, end);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      messages: data || [],
      totalCount: count || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
