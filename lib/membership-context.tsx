'use client';

console.log('MembershipContext mounted')

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useSupabase } from '@/app/providers';

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

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setIsMember(false);
          setLoading(false);
          return;
        }

        const { data: membership, error } = await supabase
          .from('memberships')
          .select('status, current_period_end')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (error) {
          console.error('[Membership Error]', error);
          setIsMember(false);
          return;
        }

        if (!membership) {
          console.log('[Membership Check] No membership found for user', currentUser.id);
          setIsMember(false);
          return;
        }

        const isActiveStatus =
          membership.status === 'active' || membership.status === 'trialing';

        const isPeriodValid =
          !membership.current_period_end ||
          new Date(membership.current_period_end) > new Date();

        setIsMember(isActiveStatus && isPeriodValid);
      } catch (error) {
        console.error('Error checking membership:', error);
        setIsMember(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const initializeAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!mounted) return;

        if (user) {
          setUser(user);
          setLoading(true);
          await checkMembership(user);
        } else {
          setUser(null);
          setIsMember(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setIsMember(false);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const authUser = session?.user || null;

      if (authUser) {
        setUser(authUser);
        setLoading(true);
        await checkMembership(authUser);
      } else {
        setUser(null);
        setIsMember(false);
        setLoading(false);
      }
    });

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
  if (context === undefined) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
}