import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { ProductWithVariants, Category, Brand, Collection } from '@/lib/database.types';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProductsPageProps {
  params: {
    tag: string;
  };
}

async function getProductsByTag(tag: string) {
  const supabase = createSupabaseServerClient();
  const [categoriesResult, brandsResult, collectionsResult, productsResult] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('brands').select('*').order('name'),
    supabase.from('collections').select('*').order('sort_order'),
    supabase.from('products').select('*, brand:brands(*), variants:product_variants(*)'),
  ]);

  const categories: Category[] = categoriesResult.data || [];
  const brands: Brand[] = brandsResult.data || [];
  const collections: Collection[] = collectionsResult.data || [];
  const allProducts: ProductWithVariants[] = (productsResult.data || []) as ProductWithVariants[];

  const tagNormalized = tag.toLowerCase().replace(/-/g, '_');

  const filteredProducts = allProducts.filter((product) => {
    if (!product.tags || !Array.isArray(product.tags)) return false;
    return product.tags.some((t) => t.toLowerCase().replace(/-/g, '_') === tagNormalized);
  });

  const collection = collections.find((c) => c.slug === tag);

  if (filteredProducts.length === 0 && !collection) {
    return null;
  }

  if (collection && collection.product_ids && collection.product_ids.length > 0) {
    const collectionProducts = allProducts.filter((p) => collection.product_ids.includes(p.id));
    const tagProducts = filteredProducts.filter((p) => !collection.product_ids.includes(p.id));
    const combinedProducts = [...collectionProducts, ...tagProducts];

    return {
      categories,
      brands,
      collections,
      products: combinedProducts,
      title: collection.name,
      description: `Explore our ${collection.name} collection`,
    };
  }

  const titleFromTag = tag
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    categories,
    brands,
    collections,
    products: filteredProducts,
    title: titleFromTag,
    description: `Explore our ${titleFromTag.toLowerCase()} collection`,
  };
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const data = await getProductsByTag(params.tag);

  if (!data) {
    notFound();
  }

  const { categories, brands, collections, products, title, description } = data;

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-light tracking-wide mb-4">{title}</h1>
            {description && <p className="text-lg text-gray-600 font-light">{description}</p>}
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-gray-500 font-light">No products found in this collection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
