import { supabasePublic } from '@/lib/supabase/public';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCarousel } from '@/components/ProductCarousel';
import { CategoryRow } from '@/components/CategoryRow';
import { TrustBar } from '@/components/TrustBar';
import { HeroGrid } from '@/components/HeroGrid';
import { SuggestionForm } from '@/components/SuggestionForm';
import { ProductCard } from '@/components/ProductCard';
import Link from 'next/link';
import { ProductWithVariants, Category, Brand, Collection } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const [categoriesResult, brandsResult, collectionsResult, productsResult, reviewsResult] =
      await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('brands').select('*').order('name'),
        supabase.from('collections').select('*').eq('display_on_home', true).order('sort_order'),
        supabase.from('products').select(`*, brand:brands(*), variants:product_variants(*)`),
        supabase.from('reviews').select('product_id, rating'),
      ]);

    const categories: Category[] = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];
    const brands: Brand[] = Array.isArray(brandsResult.data) ? brandsResult.data : [];
    const collections: Collection[] = Array.isArray(collectionsResult.data) ? collectionsResult.data : [];
    const allProducts: ProductWithVariants[] = Array.isArray(productsResult.data) ? productsResult.data as ProductWithVariants[] : [];

    const reviewsByProduct: Record<string, { rating: number }[]> = {};
    (reviewsResult.data || []).forEach((r: { product_id: string; rating: number }) => {
      if (!reviewsByProduct[r.product_id]) reviewsByProduct[r.product_id] = [];
      reviewsByProduct[r.product_id].push(r);
    });

    const productsWithRatings = allProducts.map(p => {
      const reviews = reviewsByProduct[p.id] || [];
      return {
        ...p,
        average_rating: reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : undefined,
        review_count: reviews.length,
      };
    });

    const visibleProducts = productsWithRatings.filter(p => !p.archived);

    const collectionProducts = await Promise.all(
      collections.map(async (collection) => {
        let products: ProductWithVariants[] = [];
        try {
          if (collection.product_ids?.length > 0)
            products = [...visibleProducts.filter(p => p && collection.product_ids.includes(p.id))];
          if (collection.product_tags?.length > 0) {
            const tagProducts = visibleProducts.filter(p => p?.tags?.some((t: string) => collection.product_tags.includes(t)));
            const seen = new Set(products.map(p => p.id));
            products = [...products, ...tagProducts.filter(p => p && !seen.has(p.id))];
          }
          products = products.filter(p => !p.archived);
        } catch (err) {
          console.error(`Error processing collection ${collection.id}:`, err);
        }
        return { collection, products };
      })
    );

    return { categories, brands, collections, visibleProducts, collectionProducts: collectionProducts.filter(cp => cp?.products?.length > 0) };
  } catch (error) {
    console.error('Error in getHomePageData:', error);
    return { categories: [], brands: [], collections: [], visibleProducts: [], collectionProducts: [] };
  }
}

export default async function Home() {
  const { categories, brands, collections, visibleProducts, collectionProducts } = await getHomePageData();

  // Prepare hero products — top 5-10 with member pricing for the rotating hero grid
  const heroProducts = visibleProducts
    .filter(p => p.variants?.some(v => v.member_price_cents))
    .slice(0, 10)
    .map(p => {
      const v = p.variants.find(v => v.member_price_cents) || p.variants[0];
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand?.name || '',
        image: v.images?.[0] || '/placeholder.jpg',
        retail: v.price,
        member: v.member_price_cents ? v.member_price_cents / 100 : v.price,
      };
    });

  // Best sellers grid — products flagged as best sellers, or first 10 products
  const bestSellers = visibleProducts
    .filter(p => p.is_best_seller)
    .slice(0, 10);
  const gridProducts = bestSellers.length >= 5 ? bestSellers : visibleProducts.slice(0, 10);

  return (
    <div className="min-h-screen flex flex-col bg-off-white">
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="flex flex-col md:flex-row items-center gap-6 py-15 px-[5%]"
          style={{
            background: 'linear-gradient(to right, var(--off-white) 40%, var(--blush-pink))',
            padding: '60px 5%',
          }}
        >
          {/* Hero text */}
          <div className="flex-1 min-w-0">
            <h1 className="text-hero-h1 mb-4">
              Curated beauty,<br />at prices you deserve.
            </h1>
            <p className="text-body-muted mb-8">
              Unlock wholesale pricing on premium Korean and Japanese skincare and makeup.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/pricing" className="btn-solid">
                Become a Member
              </Link>
              <Link href="/browse" className="btn-ghost">
                Shop Now
              </Link>
            </div>
          </div>

          {/* Hero product grid */}
          {heroProducts.length > 0 && (
            <div className="flex-shrink-0 hidden md:block" style={{ transform: 'translateX(-75px)' }}>
              <HeroGrid products={heroProducts} />
            </div>
          )}
        </section>

        {/* Category Row */}
        <CategoryRow />

        {/* Trust Bar */}
        <TrustBar />

        {/* Best Sellers Grid */}
        {gridProducts.length > 0 && (
          <section className="py-20 px-[5%]">
            <div className="flex justify-between items-end mb-10">
              <h2 className="text-section-h2">Best Sellers</h2>
              <Link href="/browse" className="text-[15px] font-bold text-coral hover:text-coral-hover transition-colors">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {gridProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Collection product carousels */}
        {collectionProducts.length > 0 && (
          <div className="px-[5%]">
            <div className="py-16 md:py-20 space-y-20 md:space-y-28">
              {collectionProducts.map(({ collection, products }, index) => (
                <ProductCarousel
                  key={collection.id}
                  title={collection.name}
                  products={products}
                  viewMoreSlug={collection.slug}
                  eyebrow={eyebrows[index % eyebrows.length]}
                />
              ))}
            </div>
          </div>
        )}

        {visibleProducts.length === 0 && (
          <div className="text-center py-24">
            <p className="text-base font-light text-gray">
              No products available at the moment.
            </p>
          </div>
        )}

        {/* Mid-Page Membership CTA Banner */}
        <section
          className="text-center py-20 px-5"
          style={{ background: 'linear-gradient(135deg, var(--soft-rose), var(--blush-pink))' }}
        >
          <h2 className="text-banner-h2 mb-4">Your membership pays for itself.</h2>
          <p className="text-banner-body mb-8">
            Average members save <strong>$42 a month</strong> on their beauty staples.<br />
            Buy 1 Serum (Save $15) + 1 Sunscreen (Save $12) + 1 Toner (Save $10) = <strong>$37 Saved!</strong>
          </p>
          <Link
            href="/pricing"
            className="btn-solid"
            style={{ fontSize: 18, padding: '18px 36px', borderRadius: 8 }}
          >
            Join Now for $6.99/mo
          </Link>
        </section>

        {/* Product Suggestion Section */}
        <section
          className="bg-off-white py-20 px-[5%]"
          style={{ borderTop: '1px solid var(--blush-pink)' }}
        >
          <SuggestionForm />
        </section>
      </main>

      <Footer />
    </div>
  );
}
