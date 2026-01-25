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

    if (authLoading) {
      if (DEBUG) {
        console.log("[Membership Debug] Auth still loading, waiting...");
      }
      return;
    }

    if (!user) {
      if (DEBUG) {
        console.log("[Membership Debug] No user, setting isMember=false");
      }
      setIsMember(false);
      setLoading(false);
      hasLoadedRef.current = false;
      return;
    }

    let cancelled = false;

    const loadMembership = async () => {
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

      if (cancelled) {
        if (DEBUG) {
          console.log("[Membership Debug] Update cancelled (component unmounted)");
        }
        return;
      }

      if (!data || error) {
        if (DEBUG) {
          console.log("[Membership Debug] No active membership found");
        }
        setIsMember(false);
        setLoading(false);
        hasLoadedRef.current = true;
        return;
      }

      const membershipActive =
        data.status === "active" || data.status === "past_due";

      if (DEBUG) {
        console.log("[Membership Debug] Computed values:", {
          status: data.status,
          current_period_end: data.current_period_end,
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
