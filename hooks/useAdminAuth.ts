'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export function useAdminAuth() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        setIsLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/admin/login');
          return;
        }

        const email = session.user.email?.toLowerCase();
        if (!email) {
          router.push('/admin/login');
          return;
        }

        const { data: adminCheck } = await supabase
          .from('admins')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (!adminCheck) {
          router.push('/admin/login');
          return;
        }

        setAuthChecked(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  return { authChecked, isLoading };
}
