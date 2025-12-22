import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function requireAdmin(req: NextRequest, supabase?: any) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userData, error: userErr } = await supabaseAnon.auth.getUser(token);
  const user = userData?.user;

  if (userErr || !user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.email.toLowerCase();
  const { data: adminRow, error: adminErr } = await supabaseAdmin
    .from("admins")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (adminErr || !adminRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
