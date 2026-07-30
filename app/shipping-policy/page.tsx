import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ShippingContent } from '@/components/terms/ShippingContent';
import { supabasePublic } from '@/lib/supabase/public';

export default async function ShippingPolicyPage() {
  const { data: categories } = await supabasePublic.from('categories').select('*');
  const { data: brands } = await supabasePublic.from('brands').select('*');
  const { data: collections } = await supabasePublic.from('collections').select('*');

  return (
    <>
      <Header categories={categories ?? []} brands={brands ?? []} collections={collections ?? []} />
      <main>
        <ShippingContent />
      </main>
      <Footer />
    </>
  );
}
