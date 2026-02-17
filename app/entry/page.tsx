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
        <div className="mx-auto max-w-[1100px] px-6 py-16 sm:py-24">
          {/* Hero Section */}
          <section className="text-center mb-20">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Same beauty essentials.<br />Lower prices — every time.
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Members save $1.50–$3 per item by replacing retail markups with a membership model.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors rounded-lg"
              >
                Join Cosmetic Club
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <BrowseAsGuestButton
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
          </section>

          {/* Price Comparison Cards */}
          <section className="mb-32">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                <div className="text-sm text-gray-500 mb-2">Retail</div>
                <div className="text-2xl font-bold text-gray-400 line-through mb-4">$18</div>
                <div className="text-sm text-gray-700 mb-2">Our Price</div>
                <div className="text-3xl font-bold text-gray-900">$15.49</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                <div className="text-sm text-gray-500 mb-2">Retail</div>
                <div className="text-2xl font-bold text-gray-400 line-through mb-4">$22</div>
                <div className="text-sm text-gray-700 mb-2">Our Price</div>
                <div className="text-3xl font-bold text-gray-900">$19.50</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                <div className="text-sm text-gray-500 mb-2">Retail</div>
                <div className="text-2xl font-bold text-gray-400 line-through mb-4">$15</div>
                <div className="text-sm text-gray-700 mb-2">Our Price</div>
                <div className="text-3xl font-bold text-gray-900">$12.99</div>
              </div>
            </div>
          </section>

          {/* Why Prices Are Lower */}
          <section className="mb-32">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
              Why our prices are lower
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">Membership over markup</h3>
                <p className="text-gray-600 leading-relaxed">We earn through memberships</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">Curated selection</h3>
                <p className="text-gray-600 leading-relaxed">Fewer products, better deals</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">No hype tax</h3>
                <p className="text-gray-600 leading-relaxed">No influencers, No big ads</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">Direct sourcing</h3>
                <p className="text-gray-600 leading-relaxed">Close deals with brands</p>
              </div>
            </div>
          </section>

          {/* Shop Essentials */}
          <section className="mb-32">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Shop essentials members buy most
              </h2>
              <p className="text-lg text-gray-600">
                Ourl-friendly, sulfate-free, & moisture-focused
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/collections/korean-skincare"
                className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-900 bg-white border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-colors rounded-lg"
              >
                Korean Skincare
              </Link>
              <Link
                href="/collections/sunscreen"
                className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-900 bg-white border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-colors rounded-lg"
              >
                Sunscreen
              </Link>
              <Link
                href="/collections/japanese-skincare"
                className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-900 bg-white border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-colors rounded-lg"
              >
                Japanese Skincare
              </Link>
              <Link
                href="/collections/makeup-basics"
                className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-900 bg-white border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-colors rounded-lg"
              >
                Makeup Basics
              </Link>
              <Link
                href="/collections/hair-care"
                className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-900 bg-white border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-colors rounded-lg"
              >
                Hair Care
              </Link>
            </div>
          </section>

          {/* What You Need Section */}
          <section className="mb-32 bg-gray-50 rounded-2xl p-12 border border-gray-200">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
                What you need, when you need it
              </h2>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-gray-900 rounded-full mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-lg text-gray-700">Core products always in stock</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-gray-900 rounded-full mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-lg text-gray-700">Fewer brands, deeper inventory</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-gray-900 rounded-full mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-lg text-gray-700">Restocked based on member demand</span>
                </li>
              </ul>
              <Link
                href="/collections/hair-care"
                className="inline-flex items-center px-6 py-3 text-base font-semibold text-gray-900 bg-white border-2 border-gray-900 hover:bg-gray-50 transition-colors rounded-lg"
              >
                Shop Hair Care
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-10">
              Beauty shopping, made smarter.
            </h2>
            <ul className="space-y-3 mb-12 max-w-xl mx-auto text-left">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-gray-900 rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span className="text-lg text-gray-700">Most members shop every 1–3 months</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-gray-900 rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span className="text-lg text-gray-700">Trusted brands, real savings</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-gray-900 rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span className="text-lg text-gray-700">"Feels like Costco, but for skincare."</span>
              </li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors rounded-lg"
              >
                Join Now & Save
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <BrowseAsGuestButton
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-900 hover:bg-gray-50 transition-colors rounded-lg"
              />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
