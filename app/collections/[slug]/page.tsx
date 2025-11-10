import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { ProductWithVariants, Category, Brand, Collection } from '@/lib/database.types';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CollectionsPageProps {
  params: {
    slug: string;
  };
}

async function getCollectionData(slug: string) {
  try {
    const [categoriesResult, brandsResult, collectionsResult, productsResult] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('brands').select('*').order('name'),
      supabase.from('collections').select('*').order('sort_order'),
      supabase.from('products').select('*, brand:brands(*), variants:product_variants(*)'),
    ]);

    if (categoriesResult.error) {
      console.error('Error fetching categories:', categoriesResult.error);
    }
    if (brandsResult.error) {
      console.error('Error fetching brands:', brandsResult.error);
    }
    if (collectionsResult.error) {
      console.error('Error fetching collections:', collectionsResult.error);
    }
    if (productsResult.error) {
      console.error('Error fetching products:', productsResult.error);
    }

    const categories: Category[] = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];
    const brands: Brand[] = Array.isArray(brandsResult.data) ? brandsResult.data : [];
    const collections: Collection[] = Array.isArray(collectionsResult.data) ? collectionsResult.data : [];
    const allProducts: ProductWithVariants[] = Array.isArray(productsResult.data) ? productsResult.data as ProductWithVariants[] : [];

    const category = categories.find((c) => c && c.slug === slug);
    if (category) {
      const categoryProducts = allProducts.filter((p) => p && p.category_id === category.id);
    return {
      categories,
      brands,
      collections,
      products: categoryProducts,
      title: category.name,
      description: category.description || `Explore our ${category.name} products`,
    };
  }

    const collection = collections.find((c) => c && c.slug === slug);
    if (collection) {
      let collectionProducts: ProductWithVariants[] = [];

      if (collection.product_ids && Array.isArray(collection.product_ids) && collection.product_ids.length > 0) {
        const idProducts = allProducts.filter((p) => p && collection.product_ids.includes(p.id));
        collectionProducts = [...idProducts];
      }

      if (collection.product_tags && Array.isArray(collection.product_tags) && collection.product_tags.length > 0) {
        const tagProducts = allProducts.filter(
          (p) =>
            p &&
            p.tags &&
            Array.isArray(p.tags) &&
            p.tags.some((tag) => collection.product_tags.includes(tag))
        );

        const existingIds = new Set(collectionProducts.map((p) => p.id));
        const uniqueTagProducts = tagProducts.filter((p) => p && !existingIds.has(p.id));
        collectionProducts = [...collectionProducts, ...uniqueTagProducts];
      }

    return {
      categories,
      brands,
      collections,
      products: collectionProducts,
      title: collection.name,
      description: `Explore our ${collection.name} collection`,
    };
  }

    const tagNormalized = slug.toLowerCase().replace(/-/g, '_');
    const tagProducts = allProducts.filter((product) => {
      if (!product || !product.tags || !Array.isArray(product.tags)) return false;
      return product.tags.some((t) => t && typeof t === 'string' && t.toLowerCase().replace(/-/g, '_') === tagNormalized);
    });

    if (tagProducts.length === 0) {
      return null;
    }

    const titleFromTag = slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return {
      categories,
      brands,
      collections,
      products: tagProducts,
      title: titleFromTag,
      description: `Explore our ${titleFromTag.toLowerCase()} products`,
    };
  } catch (error) {
    console.error('Error in getCollectionData:', error);
    return null;
  }
}

export default async function CollectionsPage({ params }: CollectionsPageProps) {
  const data = await getCollectionData(params.slug);

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
