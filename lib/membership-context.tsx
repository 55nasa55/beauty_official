'use client';

console.log('MembershipContext mounted')

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

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
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkMembership = async (currentUser: User) => {
      if (!mounted) return;

      try {
        console.log('Checking membership for user:', currentUser.id);

        // Get the current session to authenticate queries
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.log('No session found for membership check');
          if (mounted) {
            setIsMember(false);
            setLoading(false);
          }
          return;
        }

        console.log('Session found, authenticating client with token');

        // Authenticate the existing client with the session token
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });

        console.log('Querying memberships table for user:', currentUser.id);

        const { data: membership, error } = await supabase
          .from('memberships')
          .select('status, current_period_end')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        console.log('Membership query result:', { membership, error });

        if (!mounted) return;

        if (!membership) {
          console.log('No membership found');
          setIsMember(false);
          setLoading(false);
          return;
        }

        const isActiveStatus = membership.status === 'active' || membership.status === 'trialing';
        const isPeriodValid = !membership.current_period_end || new Date(membership.current_period_end) > new Date();

        console.log('Membership validation:', {
          status: membership.status,
          isActiveStatus,
          isPeriodValid,
          isMember: isActiveStatus && isPeriodValid
        });

        setIsMember(isActiveStatus && isPeriodValid);
      } catch (error) {
        console.error('Error checking membership:', error);
        if (mounted) {
          setIsMember(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
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
