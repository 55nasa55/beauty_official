'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BrandCard } from '@/components/BrandCard';
import { Category, Brand, Collection } from '@/lib/database.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function BrandsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [sortedBrands, setSortedBrands] = useState<Brand[]>([]);
  const [sortBy, setSortBy] = useState<'a-z' | 'z-a'>('a-z');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    sortBrands();
  }, [brands, sortBy]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesResult, brandsResult, collectionsResult] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('brands').select('*').order('name'),
        supabase.from('collections').select('*').eq('display_on_home', true).order('sort_order'),
      ]);

      if (categoriesResult.error) {
        console.error('Error fetching categories:', categoriesResult.error);
      }
      if (brandsResult.error) {
        console.error('Error fetching brands:', brandsResult.error);
        throw brandsResult.error;
      }
      if (collectionsResult.error) {
        console.error('Error fetching collections:', collectionsResult.error);
      }

      const categories = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];
      const brands = Array.isArray(brandsResult.data) ? brandsResult.data : [];
      const collections = Array.isArray(collectionsResult.data) ? collectionsResult.data : [];

      setCategories(categories);
      setBrands(brands);
      setCollections(collections);
    } catch (err: any) {
      console.error('Error fetching brands data:', err);
      setError(err.message || 'Failed to load brands');
      setCategories([]);
      setBrands([]);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const sortBrands = () => {
    if (!Array.isArray(brands) || brands.length === 0) {
      setSortedBrands([]);
      return;
    }

    const sorted = [...brands].sort((a, b) => {
      if (!a || !b || !a.name || !b.name) return 0;
      if (sortBy === 'a-z') {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });
    setSortedBrands(sorted);
  };

  const featuredBrands = sortedBrands.filter((brand: any) => brand && brand.is_featured === true);
  const regularBrands = sortedBrands.filter((brand: any) => brand && brand.is_featured !== true);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header categories={categories} brands={brands} collections={collections} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-gray-600" />
            <p className="text-lg text-gray-600">Loading brands...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header categories={categories} brands={brands} collections={collections} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <p className="text-xl text-red-600 mb-4">Error loading brands</p>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchData}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
              <h1 className="text-4xl font-light tracking-wide mb-3 md:mb-0">All Brands</h1>
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-gray-600">
                  Sort by:
                </label>
                <Select value={sortBy} onValueChange={(value: 'a-z' | 'z-a') => setSortBy(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a-z">A-Z</SelectItem>
                    <SelectItem value="z-a">Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-gray-600 text-lg">
              Explore our curated selection of premium beauty brands
            </p>
          </div>

          {brands.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No brands available.</p>
            </div>
          ) : (
            <>
              {featuredBrands.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl font-light tracking-wide">Featured Brands</h2>
                    <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-medium rounded-full">
                      FEATURED
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredBrands.map((brand) => (
                      <BrandCard key={brand.id} brand={brand} isFeatured={true} />
                    ))}
                  </div>
                </div>
              )}

              {regularBrands.length > 0 && (
                <div>
                  {featuredBrands.length > 0 && (
                    <h2 className="text-2xl font-light tracking-wide mb-6">All Brands</h2>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularBrands.map((brand) => (
                      <BrandCard key={brand.id} brand={brand} isFeatured={false} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
