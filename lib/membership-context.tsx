"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useSupabase } from "@/app/providers";

interface MembershipContextType {
  isMember: boolean;
  loading: boolean;
  user: User | null;
}

const MembershipContext = createContext<MembershipContextType>({
  isMember: false,
  loading: false,
  user: null,
});

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const supabase = useSupabase();

  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkMembership = async (currentUser: User) => {
      if (!mounted) return;

      setLoading(true);

      const { data: membership, error } = await supabase
        .from("memberships")
        .select("status, current_period_end")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      console.log("[Membership Check]", { userId: currentUser.id, membership, error });

      if (error || !membership) {
        setIsMember(false);
        setLoading(false);
        return;
      }

      const isActive =
        membership.status === "active" || membership.status === "trialing";

      const isValidPeriod =
        !membership.current_period_end ||
        new Date(membership.current_period_end) > new Date();

      setIsMember(isActive && isValidPeriod);
      setLoading(false);
    };

    const initAuth = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data.user || null;

      if (!mounted) return;

      setUser(authUser);

      if (authUser) {
        await checkMembership(authUser);
      } else {
        setIsMember(false);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (!mounted) return;

        const authUser = session?.user || null;
        setUser(authUser);

        if (authUser) {
          await checkMembership(authUser);
        } else {
          setIsMember(false);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <MembershipContext.Provider value={{ isMember, loading, user }}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  const context = useContext(MembershipContext);
  if (!context) {
    throw new Error("useMembership must be used within a MembershipProvider");
  }
  return context;
}
