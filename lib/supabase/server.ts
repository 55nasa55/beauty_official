/**
 * WARNING: DO NOT import this file in components or pages!
 *
 * This client uses Next.js cookies() which only works in:
 * - API route handlers (app/api directory)
 * - Server actions
 *
 * For server components that need public reads, use:
 * - import { supabasePublic } from '@/lib/supabase/public'
 *
 * For client components, use:
 * - import { useSupabase } from '@/app/providers'
 */

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}
