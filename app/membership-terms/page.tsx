import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { supabasePublic } from '@/lib/supabase/public';
import { MembershipTermsContent } from '@/components/terms/MembershipTermsContent';

export default async function MembershipTermsPage() {
  const { data: categories } = await supabasePublic.from('categories').select('*');
  const { data: brands } = await supabasePublic.from('brands').select('*');
  const { data: collections } = await supabasePublic.from('collections').select('*');

  return (
    <>
      <Header categories={categories ?? []} brands={brands ?? []} collections={collections ?? []} />
      <main>
        <MembershipTermsContent />
      </main>
      <Footer />
    </>
  );
}
