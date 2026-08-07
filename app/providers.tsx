"use client";

import { AuthProvider } from "@/lib/auth-context";
import { MembershipProvider } from "@/lib/membership-context";
import { WishlistProvider } from "@/lib/wishlist-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MembershipProvider>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </MembershipProvider>
    </AuthProvider>
  );
}
