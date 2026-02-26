import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BrowseAsGuestButton } from '@/components/BrowseAsGuestButton';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { supabasePublic } from '@/lib/supabase/public';
import { Category, Brand, Collection } from '@/lib/database.types';

async function getHeaderData() {
  const supabase = supabasePublic;
  try {
    const [categoriesResult, brandsResult, collectionsResult] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('brands').select('*').order('name'),
      supabase.from('collections').select('*').order('sort_order'),
    ]);

    const categories: Category[] = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];
    const brands: Brand[] = Array.isArray(brandsResult.data) ? brandsResult.data : [];
    const collections: Collection[] = Array.isArray(collectionsResult.data) ? collectionsResult.data : [];

    return { categories, brands, collections };
  } catch (error) {
    console.error('Error fetching header data:', error);
    return { categories: [], brands: [], collections: [] };
  }
}

export default async function EntryPage() {
  const { categories, brands, collections } = await getHeaderData();
  return (
    <>
      <Header categories={categories} brands={brands} collections={collections} />
      <main className="min-h-screen bg-white">
        {/* Premium Hero Section */}
        <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-neutral-100">

          {/* Hero background image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105 animate-[slowzoom_12s_ease-in-out_infinite]"
            style={{ backgroundImage: "url('/images/entry-hero-premium.jpg')" }}
          />

          {/* Premium gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/60 to-white/90" />
          <div className="absolute inset-0 backdrop-blur-[3px]" />

          {/* Soft vignette for luxury depth */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_60%,rgba(0,0,0,0.08)_100%)]" />

          {/* Foreground content */}
          <div className="relative z-10 flex flex-col items-center justify-center px-6 py-24 min-h-screen animate-fadeIn">
            <div className="max-w-3xl w-full bg-white/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-10 py-12 text-center border border-white/40">
              <h1 className="text-5xl font-semibold text-neutral-900 leading-tight mb-4">
                Same beauty essentials.<br />Lower prices — every time.
              </h1>

              <p className="text-lg text-neutral-600 mb-10">
                Members can save up to 30% or more per item.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mb-6">
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-[#9DCBF3] hover:bg-[#8EC3EE] transition-colors rounded-lg"
                >
                  Join Cosmetic Club
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <BrowseAsGuestButton
                  label="Browse Products"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-900 hover:bg-gray-50 transition-colors rounded-lg"
                />
              </div>

              <Link
                href="/why-prices-are-lower"
                className="inline-flex items-center text-gray-700 hover:text-gray-900 font-medium underline underline-offset-4"
              >
                See How Pricing Works
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* Price Comparison Cards (now inside hero) */}
            <div className="mt-12 w-full flex justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full mx-auto px-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-xl p-8 text-center border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-500 mb-2">Retail</div>
                  <div className="text-2xl font-bold text-red-500 line-through mb-4">$18</div>
                  <div className="text-sm text-gray-700 mb-2">Our Price</div>
                  <div className="text-3xl font-bold text-gray-900">$15.49</div>
                </div>
                <div className="bg-white/80 backdrop-blur-xl rounded-xl p-8 text-center border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-500 mb-2">Retail</div>
                  <div className="text-2xl font-bold text-red-500 line-through mb-4">$22</div>
                  <div className="text-sm text-gray-700 mb-2">Our Price</div>
                  <div className="text-3xl font-bold text-gray-900">$19.50</div>
                </div>
                <div className="bg-white/80 backdrop-blur-xl rounded-xl p-8 text-center border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-500 mb-2">Retail</div>
                  <div className="text-2xl font-bold text-red-500 line-through mb-4">$15</div>
                  <div className="text-sm text-gray-700 mb-2">Our Price</div>
                  <div className="text-3xl font-bold text-gray-900">$12.99</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1100px] px-6 py-16 sm:py-24">

          {/* Shop Essentials (restored & simplified) */}
          <section className="mt-32 mb-32">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Shop essentials members buy most
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/collections/korean-beauty"
                className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-900 bg-white border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-colors rounded-lg"
              >
                Korean Beauty
              </Link>

              <Link
                href="/collections/suncare"
                className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-900 bg-white border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-colors rounded-lg"
              >
                Suncare
              </Link>

              <Link
                href="/collections/japanese-beauty"
                className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-900 bg-white border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-colors rounded-lg"
              >
                Japanese Beauty
              </Link>

              <Link
                href="/collections/haircare"
                className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-900 bg-white border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-colors rounded-lg"
              >
                Haircare
              </Link>

              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-900 bg-white border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-colors rounded-lg"
              >
                Browse All
              </Link>
            </div>
          </section>

          {/* Why Prices Are Lower */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-12">
                  Why our prices are lower
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                  <div className="text-center flex flex-col items-center justify-center">
                    <h3 className="text-xl font-semibold mb-3">Membership over markup</h3>
                    <p className="text-gray-600">
                      We use a membership model instead of traditional retail markups, passing savings directly to you.
                    </p>
                  </div>

                  <div className="text-center flex flex-col items-center justify-center">
                    <h3 className="text-xl font-semibold mb-3">Curated selection</h3>
                    <p className="text-gray-600">
                      We focus on quality over quantity, carefully selecting products that deliver real value.
                    </p>
                  </div>

                  <div className="text-center flex flex-col items-center justify-center">
                    <h3 className="text-xl font-semibold mb-3">No hype tax</h3>
                    <p className="text-gray-600">
                      We skip expensive marketing campaigns and celebrity endorsements, keeping prices fair.
                    </p>
                  </div>

                  <div className="text-center flex flex-col items-center justify-center">
                    <h3 className="text-xl font-semibold mb-3">Direct sourcing</h3>
                    <p className="text-gray-600">
                      We work directly with manufacturers to eliminate middlemen and reduce costs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          </div>
      </main>
      <Footer />
    </>
  );
}
