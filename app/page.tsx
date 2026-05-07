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
  { label: '🌸 K-Beauty',      href: '/collections/korean-beauty' },
  { label: '🌿 J-Beauty',      href: '/collections/japanese-beauty' },
  { label: '✨ Skincare',      href: '/collections/skincare' },
  { label: '💄 Makeup',        href: '/collections/makeup' },
  { label: '☀️ Suncare',       href: '/collections/suncare' },
  { label: '🌺 Hair',          href: '/collections/haircare' },
  { label: '🍃 Face Masks',    href: '/collections/face-masks' },
  { label: '🛁 Bath & Body',   href: '/collections/bath-body' },
  { label: '🖌️ Brush & Tools', href: '/collections/brush-tools' },
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
        supabase.from('collections').select('*').eq('display_on_home', true).order('sort_order'),
        supabase.from('banners').select('*').eq('active', true).order('sort_order'),
        supabase.from('products').select(`*, brand:brands(*), variants:product_variants(*)`),
        supabase.from('reviews').select('product_id, rating'),
      ]);

    const categories: Category[] = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];
    const brands: Brand[] = Array.isArray(brandsResult.data) ? brandsResult.data : [];
    const collections: Collection[] = Array.isArray(collectionsResult.data) ? collectionsResult.data : [];
    const banners: Banner[] = Array.isArray(bannersResult.data) ? bannersResult.data : [];
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

    return { categories, brands, collections, banners, collectionProducts: collectionProducts.filter(cp => cp?.products?.length > 0) };
  } catch (error) {
    console.error('Error in getHomePageData:', error);
    return { categories: [], brands: [], collections: [], banners: [], collectionProducts: [] };
  }
}

export default async function Home() {
  const { categories, brands, collections, banners, collectionProducts } = await getHomePageData();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#fdf8f5' }}>
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1">

        {/* Hero / Banner Carousel */}
        {banners.length > 0 && (
          <DynamicBannerCarousel initialBanners={banners} />
        )}

        {/* Category chips */}
        <div className="py-8 border-b" style={{ background: 'linear-gradient(180deg,#fdf0f4 0%,#fdf8f5 100%)', borderColor: '#f4d0d8' }}>
          <div className="max-w-[1320px] mx-auto px-6">
            {/* Eyebrow */}
            <p className="text-center text-[10px] uppercase tracking-[0.22em] font-bold mb-5" style={{ color: '#d4909e' }}>
              ✦ Shop By Category ✦
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {categoryChips.map((chip) => (
                <Link
                  key={chip.href}
                  href={chip.href}
                  className="group px-5 py-2.5 rounded-full text-[12px] font-semibold transition-all duration-200 whitespace-nowrap"
                  style={{
                    background: 'linear-gradient(135deg, rgba(252,232,238,0.8) 0%, rgba(249,212,222,0.6) 100%)',
                    color: '#c07888',
                    border: '1px solid rgba(244,192,204,0.5)',
                    boxShadow: '0 1px 4px rgba(244,167,185,0.12)',
                  }}
                  onMouseOver={e => {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'linear-gradient(135deg, #fce8ee 0%, #f9d4de 100%)';
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 3px 10px rgba(244,167,185,0.25)';
                    (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={e => {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'linear-gradient(135deg, rgba(252,232,238,0.8) 0%, rgba(249,212,222,0.6) 100%)';
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 1px 4px rgba(244,167,185,0.12)';
                    (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                  }}
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Product collection sections */}
        <div className="max-w-[1320px] mx-auto px-6">
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

            {collectionProducts.length === 0 && (
              <div className="text-center py-24">
                <p className="text-base font-light" style={{ color: '#c4a0a8' }}>
                  No products available at the moment.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom decorative strip */}
        <div className="py-12 mt-8" style={{ background: 'linear-gradient(135deg,#fce8ee 0%,#fdf0f4 40%,#fde8f4 100%)' }}>
          <div className="max-w-[1320px] mx-auto px-6 text-center">
            <p className="text-[10px] uppercase tracking-[0.22em] font-bold mb-3" style={{ color: '#d4909e' }}>✦ Cosmetic Club ✦</p>
            <p
              className="text-2xl md:text-3xl font-light"
              style={{ fontFamily: "'Playfair Display', serif", color: '#3a2a2a' }}
            >
              Curated beauty, at prices you deserve.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center h-11 px-8 mt-6 rounded-full text-[12.5px] font-bold tracking-wide text-white transition-all duration-200 shadow hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #f4b8c8 0%, #d4607e 100%)' }}
            >
              Become a Member →
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
