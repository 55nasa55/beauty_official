import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MembershipContent } from '@/components/MembershipContent';
import { supabasePublic } from '@/lib/supabase/public';

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  stripe_price_id: string;
  billing_interval: string;
  amount_cents: number | null;
  is_active: boolean;
  sort_order: number;
}

export default async function PricingPage() {
  const [catRes, brandRes, collRes, planRes] = await Promise.all([
    supabasePublic.from('categories').select('*'),
    supabasePublic.from('brands').select('*'),
    supabasePublic.from('collections').select('*'),
    supabasePublic
      .from('membership_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const annualPlan = (planRes.data as MembershipPlan | null) ?? null;

  return (
    <>
      <Header
        categories={catRes.data ?? []}
        brands={brandRes.data ?? []}
        collections={collRes.data ?? []}
      />
      <main>
        <MembershipContent annualPlan={annualPlan} />
      </main>
      <Footer />
    </>
  );
}
