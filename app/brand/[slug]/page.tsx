import { supabasePublic } from '@/lib/supabase/public';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { ProductWithVariants, Category, Brand, Collection } from '@/lib/database.types';
import { notFound } from 'next/navigation';
import Image from 'next/image';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getBrandData(slug: string) {
  const supabase = supabasePublic;
  const [categoriesResult, brandsResult, collectionsResult, brandResult] =
    await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('brands').select('*').order('name'),
      supabase
        .from('collections')
        .select('*')
        .eq('display_on_home', true)
        .order('sort_order'),
      supabase.from('brands').select('*').eq('slug', slug).maybeSingle(),
    ]);

  const categories: Category[] = categoriesResult.data || [];
  const brands: Brand[] = brandsResult.data || [];
  const collections: Collection[] = collectionsResult.data || [];
  const brand = brandResult.data as Brand | null;

  let products: ProductWithVariants[] = [];

  if (brand) {
    const productsResult = await supabase
      .from('products')
      .select('*, brand:brands(*), variants:product_variants(*)')
      .eq('brand_id', brand.id as string);

    products = (productsResult.data || []) as ProductWithVariants[];
  }

  return {
    categories,
    brands,
    collections,
    brand,
    products,
  };
}

export default async function BrandPage({
  params,
}: {
  params: { slug: string };
}) {
  const { categories, brands, collections, brand, products } = await getBrandData(params.slug);

  if (!brand) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-12 text-center">
            <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden bg-gray-100">
              <Image
                src={brand.logo_url}
                alt={brand.name}
                fill
                className="object-cover"
              />
            </div>
            <h1 className="text-4xl font-light tracking-wide mb-3">{brand.name}</h1>
            {brand.description && (
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">{brand.description}</p>
            )}
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No products available from this brand.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
