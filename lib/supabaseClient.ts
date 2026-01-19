import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton browser client for use across the app
// This maintains auth state properly with @supabase/ssr
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
