"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";

interface MembershipContextType {
  isMember: boolean;
  loading: boolean;
}

const MembershipContext = createContext<MembershipContextType>({
  isMember: false,
  loading: true,
});

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

  useEffect(() => {
    if (DEBUG) {
      console.log("[Membership Debug] Effect triggered", {
        userId: user?.id,
        authLoading,
      });
    }

    // Wait until auth is fully ready
    if (authLoading) {
      if (DEBUG) {
        console.log("[Membership Debug] Auth still loading, waiting...");
      }
      return;
    }

    // No user = no membership
    if (!user) {
      if (DEBUG) {
        console.log("[Membership Debug] No user, setting isMember=false");
      }
      setIsMember(false);
      setLoading(false);
      hasLoadedRef.current = false;
      return;
    }

    // Prevent stale async updates
    let cancelled = false;

    const loadMembership = async () => {
      // Only set loading to true if we haven't successfully loaded yet
      if (!hasLoadedRef.current) {
        setLoading(true);
      }

      if (DEBUG) {
        console.log("[Membership Debug] Fetching membership for user:", user.id);
      }

      const { data, error } = await supabase
        .from("memberships")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      if (DEBUG) {
        console.log("[Membership Debug] Query result:", {
          userId: user.id,
          data,
          error: error?.message || null
        });
      }

      // Abort if the component unmounted or effect re-ran
      if (cancelled) {
        if (DEBUG) {
          console.log("[Membership Debug] Update cancelled (component unmounted)");
        }
        return;
      }

      // No membership row or query error
      if (!data || error) {
        if (DEBUG) {
          console.log("[Membership Debug] No active membership found");
        }
        setIsMember(false);
        setLoading(false);
        hasLoadedRef.current = true;
        return;
      }

      // Check if membership is active
      const isActiveMembership = data.status === "active";

      // Check if current_period_end is valid (null or in the future)
      const validPeriod =
        !data.current_period_end ||
        new Date(data.current_period_end) > new Date();

      const membershipActive = isActiveMembership && validPeriod;

      if (DEBUG) {
        console.log("[Membership Debug] Computed values:", {
          status: data.status,
          current_period_end: data.current_period_end,
          isActiveMembership,
          validPeriod,
          membershipActive,
        });
      }

      setIsMember(membershipActive);
      setLoading(false);
      hasLoadedRef.current = true;

      if (DEBUG) {
        console.log("[Membership Debug] Final state:", {
          isMember: membershipActive,
          loading: false,
        });
      }
    };

    loadMembership();

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  return (
    <MembershipContext.Provider value={{ isMember, loading }}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  return useContext(MembershipContext);
}
