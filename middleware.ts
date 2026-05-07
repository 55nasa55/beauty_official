import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  return NextResponse.next({ request: { headers: req.headers } });
}

export const config = {
  matcher: [
    "/admin/:path*",       // Protect admin dashboard
    "/api/admin/:path*",   // Protect admin API endpoints
    "/api/stripe/:path*",  // Protect Stripe-related APIs
  ],
};
