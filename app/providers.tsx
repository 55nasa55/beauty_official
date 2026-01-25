"use client";

import { AuthProvider } from "@/lib/auth-context";
import { MembershipProvider } from "@/lib/membership-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MembershipProvider>
        {children}
      </MembershipProvider>
    </AuthProvider>
  );
}
