"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useSupabase } from "@/app/providers";
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
  const supabase = useSupabase();
  const { user, loading: authLoading } = useAuth();

  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🚫 Wait until auth is fully ready
    if (authLoading) return;

    // 🚫 No user = no membership
    if (!user) {
      setIsMember(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadMembership = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("memberships")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("[Membership]", { userId: user.id, data, error });

      if (cancelled) return;

      if (!data || error) {
        setIsMember(false);
        setLoading(false);
        return;
      }

      const active =
        data.status === "active" || data.status === "trialing";

      const validPeriod =
        !data.current_period_end ||
        new Date(data.current_period_end) > new Date();

      setIsMember(active && validPeriod);
      setLoading(false);
    };

    loadMembership();

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading, supabase]);

  return (
    <MembershipContext.Provider value={{ isMember, loading }}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  return useContext(MembershipContext);
}