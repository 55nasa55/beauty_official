import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BannerCarousel } from '@/components/BannerCarousel';
import { ProductCarousel } from '@/components/ProductCarousel';
import { ProductWithVariants, Category, Brand, Collection, Banner } from '@/lib/database.types';

async function getHomePageData() {
  const [categoriesResult, brandsResult, collectionsResult, bannersResult, productsResult] =
    await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('brands').select('*').order('name'),
      supabase
        .from('collections')
        .select('*')
        .eq('display_on_home', true)
        .order('sort_order'),
      supabase.from('banners').select('*').eq('active', true).order('sort_order'),
      supabase.from('products').select('*, brand:brands(*), variants:product_variants(*)'),
    ]);

  const categories: Category[] = categoriesResult.data || [];
  const brands: Brand[] = brandsResult.data || [];
  const collections: Collection[] = collectionsResult.data || [];
  const banners: Banner[] = bannersResult.data || [];
  const allProducts: ProductWithVariants[] = (productsResult.data || []) as ProductWithVariants[];

  const allTags = new Set<string>();
  allProducts.forEach((product) => {
    if (product.tags && Array.isArray(product.tags)) {
      product.tags.forEach((tag) => {
        if (tag && tag.trim()) {
          allTags.add(tag);
        }
      });
    }
  });

  const tagCarousels = Array.from(allTags).map((tag) => {
    const tagProducts = allProducts.filter(
      (p) => p.tags && Array.isArray(p.tags) && p.tags.includes(tag)
    );
    return {
      tag,
      slug: tag.toLowerCase().replace(/_/g, '-'),
      title: tag
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      products: tagProducts,
    };
  });

  const collectionProducts = await Promise.all(
    collections.map(async (collection) => {
      let products: ProductWithVariants[] = [];

      if (collection.product_ids && collection.product_ids.length > 0) {
        const idProducts = allProducts.filter((p) => collection.product_ids.includes(p.id));
        products = [...idProducts];
      }

      if (collection.product_tags && collection.product_tags.length > 0) {
        const tagProducts = allProducts.filter(
          (p) =>
            p.tags &&
            Array.isArray(p.tags) &&
            p.tags.some((tag) => collection.product_tags.includes(tag))
        );

        const existingIds = new Set(products.map((p) => p.id));
        const uniqueTagProducts = tagProducts.filter((p) => !existingIds.has(p.id));
        products = [...products, ...uniqueTagProducts];
      }

      return {
        collection,
        products,
      };
    })
  );

  return {
    categories,
    brands,
    collections,
    banners,
    tagCarousels: tagCarousels.filter((tc) => tc.products.length > 0),
    collectionProducts: collectionProducts.filter((cp) => cp.products.length > 0),
  };
}

export default async function Home() {
  const {
    categories,
    brands,
    collections,
    banners,
    tagCarousels,
    collectionProducts,
  } = await getHomePageData();

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-12">
            <BannerCarousel banners={banners} />
          </div>

          <div className="space-y-16">
            {tagCarousels.map(({ tag, slug, title, products }) => (
              <ProductCarousel key={tag} title={title} products={products} viewMoreSlug={slug} />
            ))}

            {collectionProducts.map(({ collection, products }) => (
              <ProductCarousel
                key={collection.id}
                title={collection.name}
                products={products}
                viewMoreSlug={collection.slug}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
