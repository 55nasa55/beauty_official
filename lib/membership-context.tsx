'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from './supabase/browser';

interface MembershipContextType {
  isMember: boolean;
  loading: boolean;
  user: User | null;
}

const MembershipContext = createContext<MembershipContextType>({
  isMember: false,
  loading: true,
  user: null,
});

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const checkMembership = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (!user) {
          setIsMember(false);
          setLoading(false);
          return;
        }

        const { data: membership } = await supabase
          .from('memberships')
          .select('status, current_period_end')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!membership) {
          setIsMember(false);
          setLoading(false);
          return;
        }

        const isActiveStatus = membership.status === 'active' || membership.status === 'trialing';
        const isPeriodValid = !membership.current_period_end || new Date(membership.current_period_end) > new Date();

        setIsMember(isActiveStatus && isPeriodValid);
        setLoading(false);
      } catch (error) {
        console.error('Error checking membership:', error);
        setIsMember(false);
        setLoading(false);
      }
    };

    checkMembership();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkMembership();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <MembershipContext.Provider value={{ isMember, loading, user }}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  const context = useContext(MembershipContext);
  if (context === undefined) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
}
