import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PrivacyContent } from '@/components/terms/PrivacyContent';
import { supabasePublic } from '@/lib/supabase/public';

export default async function PrivacyPolicyPage() {
  const { data: categories } = await supabasePublic.from('categories').select('*');
  const { data: brands } = await supabasePublic.from('brands').select('*');
  const { data: collections } = await supabasePublic.from('collections').select('*');

  return (
    <>
      <Header categories={categories ?? []} brands={brands ?? []} collections={collections ?? []} />
      <main>
        <PrivacyContent />
      </main>
      <Footer />
    </>
  );
}
