import { supabasePublic } from '@/lib/supabase/public';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DynamicBannerCarousel } from '@/components/DynamicBannerCarousel';
import { ProductCarousel } from '@/components/ProductCarousel';
import { ProductWithVariants, Category, Brand, Collection, Banner } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getHomePageData() {
  const supabase = supabasePublic;
  try {
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

    if (categoriesResult.error) {
      console.error('Error fetching categories:', categoriesResult.error);
    }
    if (brandsResult.error) {
      console.error('Error fetching brands:', brandsResult.error);
    }
    if (collectionsResult.error) {
      console.error('Error fetching collections:', collectionsResult.error);
    }
    if (bannersResult.error) {
      console.error('Error fetching banners:', bannersResult.error);
    }
    if (productsResult.error) {
      console.error('Error fetching products:', productsResult.error);
    }

    const categories: Category[] = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];
    const brands: Brand[] = Array.isArray(brandsResult.data) ? brandsResult.data : [];
    const collections: Collection[] = Array.isArray(collectionsResult.data) ? collectionsResult.data : [];
    const banners: Banner[] = Array.isArray(bannersResult.data) ? bannersResult.data : [];
    const allProducts: ProductWithVariants[] = Array.isArray(productsResult.data) ? productsResult.data as ProductWithVariants[] : [];

    const allTags = new Set<string>();
    allProducts.forEach((product) => {
      if (product && product.tags && Array.isArray(product.tags)) {
        product.tags.forEach((tag) => {
          if (tag && typeof tag === 'string' && tag.trim()) {
            allTags.add(tag);
          }
        });
      }
    });

    const excludedTags = new Set(['featured', 'new', 'best_seller']);

    const tagCarousels = Array.from(allTags)
      .filter((tag) => !excludedTags.has(tag.toLowerCase()))
      .map((tag) => {
        const tagProducts = allProducts.filter(
          (p) => p && p.tags && Array.isArray(p.tags) && p.tags.includes(tag)
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

        try {
          if (collection.product_ids && Array.isArray(collection.product_ids) && collection.product_ids.length > 0) {
            const idProducts = allProducts.filter((p) => p && collection.product_ids.includes(p.id));
            products = [...idProducts];
          }

          if (collection.product_tags && Array.isArray(collection.product_tags) && collection.product_tags.length > 0) {
            const tagProducts = allProducts.filter(
              (p) =>
                p &&
                p.tags &&
                Array.isArray(p.tags) &&
                p.tags.some((tag) => collection.product_tags.includes(tag))
            );

            const existingIds = new Set(products.map((p) => p.id));
            const uniqueTagProducts = tagProducts.filter((p) => p && !existingIds.has(p.id));
            products = [...products, ...uniqueTagProducts];
          }
        } catch (err) {
          console.error(`Error processing collection ${collection.id}:`, err);
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
      tagCarousels: tagCarousels.filter((tc) => tc && tc.products && tc.products.length > 0),
      collectionProducts: collectionProducts.filter((cp) => cp && cp.products && cp.products.length > 0),
    };
  } catch (error) {
    console.error('Error in getHomePageData:', error);

    return {
      categories: [],
      brands: [],
      collections: [],
      banners: [],
      tagCarousels: [],
      collectionProducts: [],
    };
  }
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
        {banners.length > 0 && (
          <section className="relative w-screen overflow-hidden mb-12">
            <DynamicBannerCarousel initialBanners={banners} />
          </section>
        )}

        <div className="container mx-auto px-4 py-8">
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

            {tagCarousels.length === 0 && collectionProducts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-xl text-gray-500 font-light">
                  No products available at the moment.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
