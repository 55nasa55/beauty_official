"use client";

import { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsMember(false);
      setLoading(false);
      return;
    }

    const loadMembership = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("memberships")
        .select("status, current_period_end, cancel_at_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data || error) {
        setIsMember(false);
        setLoading(false);
        return;
      }

      // STRICT MEMBERSHIP ACCESS:
      // Only allow access when:
      // 1. Subscription is active (NOT past_due)
      // 2. Current period has not ended
      const isActive =
        data.status === "active" &&
        data.current_period_end &&
        new Date(data.current_period_end) > new Date();

      setIsMember(isActive);

      setLoading(false);
    };

    loadMembership();
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