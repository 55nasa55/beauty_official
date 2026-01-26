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

      const now = new Date();
      const ends = data.current_period_end ? new Date(data.current_period_end) : null;

      const status = data.status;

      const activeStatus = status === "active" || status === "past_due";

      const validPeriod = !ends || ends > now;

      // FINAL RULE:
      // A user is a member if:
      // - active or past_due
      // - AND within the billing period
      setIsMember(activeStatus && validPeriod);

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