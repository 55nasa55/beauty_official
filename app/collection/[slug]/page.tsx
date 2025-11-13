'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { ProductWithVariants, Category, Brand, Collection } from '@/lib/database.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CollectionPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [sortedProducts, setSortedProducts] = useState<ProductWithVariants[]>([]);
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [categoriesResult, brandsResult, collectionsResult, collectionResult] =
        await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase.from('brands').select('*').order('name'),
          supabase
            .from('collections')
            .select('*')
            .eq('display_on_home', true)
            .order('sort_order'),
          supabase.from('collections').select('*').eq('slug', slug).maybeSingle(),
        ]);

      setCategories(categoriesResult.data || []);
      setBrands(brandsResult.data || []);
      setCollections(collectionsResult.data || []);

      const coll = collectionResult.data as Collection | null;
      setCollection(coll);

      if (coll) {
        const allProductsResult = await supabase
          .from('products')
          .select('*, brand:brands(*), variants:product_variants(*)');

        const allProducts = (allProductsResult.data || []) as ProductWithVariants[];
        let collectionProducts: ProductWithVariants[] = [];

        if (coll.product_ids && coll.product_ids.length > 0) {
          const idProducts = allProducts.filter((p) => coll.product_ids.includes(p.id));
          collectionProducts = [...idProducts];
        }

        if (coll.product_tags && coll.product_tags.length > 0) {
          const tagProducts = allProducts.filter(
            (p) =>
              p.tags &&
              Array.isArray(p.tags) &&
              p.tags.some((tag) => coll.product_tags.includes(tag))
          );

          const existingIds = new Set(collectionProducts.map((p) => p.id));
          const uniqueTagProducts = tagProducts.filter((p) => !existingIds.has(p.id));
          collectionProducts = [...collectionProducts, ...uniqueTagProducts];
        }

        setProducts(collectionProducts);
        setSortedProducts(collectionProducts);
      }

      setLoading(false);
    }

    fetchData();
  }, [slug]);

  useEffect(() => {
    const sorted = [...products];

    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        sorted.sort((a, b) => {
          const priceA = a.variants[0]?.price || 0;
          const priceB = b.variants[0]?.price || 0;
          return priceA - priceB;
        });
        break;
      case 'price-high':
        sorted.sort((a, b) => {
          const priceA = a.variants[0]?.price || 0;
          const priceB = b.variants[0]?.price || 0;
          return priceB - priceA;
        });
        break;
      case 'newest':
        sorted.sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        break;
      case 'best-seller':
        sorted.sort((a, b) => {
          if (a.is_best_seller && !b.is_best_seller) return -1;
          if (!a.is_best_seller && b.is_best_seller) return 1;
          return 0;
        });
        break;
    }

    setSortedProducts(sorted);
  }, [sortBy, products]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Collection not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-light tracking-wide mb-3">{collection.name}</h1>
          </div>

          {sortedProducts.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-gray-600">
                  {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'}
                </p>
                <div className="flex items-center gap-2">
                  <label htmlFor="sort" className="text-sm text-gray-600">
                    Sort by:
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="best-seller">Best Seller</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found in this collection.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
