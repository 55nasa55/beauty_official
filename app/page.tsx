import { supabasePublic } from '@/lib/supabase/public';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DynamicBannerCarousel } from '@/components/DynamicBannerCarousel';
import { ProductCarousel } from '@/components/ProductCarousel';
import Link from 'next/link';
import { ProductWithVariants, Category, Brand, Collection, Banner } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const categoryChips = [
  { label: 'K-Beauty', href: '/collections/korean-beauty' },
  { label: 'J-Beauty', href: '/collections/japanese-beauty' },
  { label: 'Skincare', href: '/collections/skincare' },
  { label: 'Makeup', href: '/collections/makeup' },
  { label: 'Suncare', href: '/collections/suncare' },
  { label: 'Hair', href: '/collections/haircare' },
  { label: 'Face Masks', href: '/collections/face-masks' },
  { label: 'Bath & Body', href: '/collections/bath-body' },
  { label: 'Brush & Tools', href: '/collections/brush-tools' },
];

const eyebrows = [
  'Community Favorites',
  'Trending Now',
  "Editor's Picks",
  'Members Love',
  'New Arrivals',
];

async function getHomePageData() {
  const supabase = supabasePublic;
  try {
    const [categoriesResult, brandsResult, collectionsResult, bannersResult, productsResult, reviewsResult] =
      await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('brands').select('*').order('name'),
        supabase
          .from('collections')
          .select('*')
          .eq('display_on_home', true)
          .order('sort_order'),
        supabase.from('banners').select('*').eq('active', true).order('sort_order'),
        supabase.from('products').select(`
          *,
          brand:brands(*),
          variants:product_variants(*)
        `),
        supabase.from('reviews').select('product_id, rating'),
      ]);

    const categories: Category[] = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];
    const brands: Brand[] = Array.isArray(brandsResult.data) ? brandsResult.data : [];
    const collections: Collection[] = Array.isArray(collectionsResult.data) ? collectionsResult.data : [];
    const banners: Banner[] = Array.isArray(bannersResult.data) ? bannersResult.data : [];
    const allProducts: ProductWithVariants[] = Array.isArray(productsResult.data) ? productsResult.data as ProductWithVariants[] : [];

    const reviewsByProduct: Record<string, { rating: number }[]> = {};
    (reviewsResult.data || []).forEach((review: { product_id: string; rating: number }) => {
      if (!reviewsByProduct[review.product_id]) reviewsByProduct[review.product_id] = [];
      reviewsByProduct[review.product_id].push(review);
    });

    const productsWithRatings = allProducts.map(product => {
      const reviews = reviewsByProduct[product.id] || [];
      return {
        ...product,
        average_rating: reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : undefined,
        review_count: reviews.length,
      };
    });

    const visibleProducts = productsWithRatings.filter(p => !p.archived);

    const collectionProducts = await Promise.all(
      collections.map(async (collection) => {
        let products: ProductWithVariants[] = [];
        try {
          if (collection.product_ids && Array.isArray(collection.product_ids) && collection.product_ids.length > 0) {
            products = [...visibleProducts.filter((p) => p && collection.product_ids.includes(p.id))];
          }
          if (collection.product_tags && Array.isArray(collection.product_tags) && collection.product_tags.length > 0) {
            const tagProducts = visibleProducts.filter(
              (p) => p && p.tags && Array.isArray(p.tags) && p.tags.some((tag) => collection.product_tags.includes(tag))
            );
            const existingIds = new Set(products.map((p) => p.id));
            products = [...products, ...tagProducts.filter((p) => p && !existingIds.has(p.id))];
          }
          products = products.filter(p => !p.archived);
        } catch (err) {
          console.error(`Error processing collection ${collection.id}:`, err);
        }
        return { collection, products };
      })
    );

    return {
      categories,
      brands,
      collections,
      banners,
      collectionProducts: collectionProducts.filter((cp) => cp && cp.products && cp.products.length > 0),
    };
  } catch (error) {
    console.error('Error in getHomePageData:', error);
    return { categories: [], brands: [], collections: [], banners: [], collectionProducts: [] };
  }
}

export default async function Home() {
  const { categories, brands, collections, banners, collectionProducts } = await getHomePageData();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1">
        {/* Hero / Banner Carousel */}
        {banners.length > 0 && (
          <DynamicBannerCarousel initialBanners={banners} />
        )}

        {/* Category chips */}
        <div className="bg-white py-8 border-b border-stone-100">
          <div className="max-w-[1320px] mx-auto px-6">
            <div className="flex flex-wrap justify-center gap-2.5">
              {categoryChips.map((chip) => (
                <Link
                  key={chip.href}
                  href={chip.href}
                  className="px-4 py-2 bg-white border border-stone-200 rounded-full text-[12px] font-medium text-stone-500 hover:text-stone-800 hover:border-stone-400 hover:bg-stone-50/50 transition-all duration-150 whitespace-nowrap"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Product collection sections */}
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="py-16 md:py-20 space-y-20 md:space-y-24">
            {collectionProducts.map(({ collection, products }, index) => (
              <ProductCarousel
                key={collection.id}
                title={collection.name}
                products={products}
                viewMoreSlug={collection.slug}
                eyebrow={eyebrows[index % eyebrows.length]}
              />
            ))}

            {collectionProducts.length === 0 && (
              <div className="text-center py-24">
                <p className="text-base text-stone-400 font-light">
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
