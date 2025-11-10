import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BrandCard } from '@/components/BrandCard';
import { Category, Brand, Collection } from '@/lib/database.types';

async function getBrandsData() {
  const [categoriesResult, brandsResult, collectionsResult] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('brands').select('*').order('name'),
    supabase
      .from('collections')
      .select('*')
      .eq('display_on_home', true)
      .order('sort_order'),
  ]);

  const categories: Category[] = categoriesResult.data || [];
  const brands: Brand[] = brandsResult.data || [];
  const collections: Collection[] = collectionsResult.data || [];

  return {
    categories,
    brands,
    collections,
  };
}

export default async function BrandsPage() {
  const { categories, brands, collections } = await getBrandsData();

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-light tracking-wide mb-3">All Brands</h1>
            <p className="text-gray-600 text-lg">
              Explore our curated selection of premium beauty brands
            </p>
          </div>

          {brands.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brands.map((brand) => (
                <BrandCard key={brand.id} brand={brand} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No brands available.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
