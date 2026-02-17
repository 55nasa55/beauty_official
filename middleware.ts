import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const pathname = req.nextUrl.pathname;

  if (pathname === "/") {
    // Allow guest bypass
    const guestBypass = req.cookies.get("cc_guest_bypass");
    if (guestBypass?.value === "true") {
      return res;
    }

    if (!session?.user) {
      return NextResponse.redirect(new URL("/entry", req.url));
    }

    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .is("ended_at", null)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return NextResponse.redirect(new URL("/entry", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/"],
};
