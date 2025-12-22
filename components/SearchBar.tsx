'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, Package, Building2 } from 'lucide-react';
import { useSupabase } from '@/app/providers';
import { ProductWithVariants, Brand } from '@/lib/database.types';

interface SearchResults {
  products: ProductWithVariants[];
  brands: Brand[];
}

export function SearchBar() {
  const supabase = useSupabase();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ products: [], brands: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchAll = async () => {
      if (query.trim().length < 2) {
        setResults({ products: [], brands: [] });
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      setIsOpen(true);

      try {
        const searchTerm = query.trim().toLowerCase();

        const [productsResult, brandsResult] = await Promise.all([
          supabase
            .from('products')
            .select('*, brand:brands(*), variants:product_variants(*)')
            .or(
              `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`
            )
            .limit(6),
          supabase
            .from('brands')
            .select('*')
            .ilike('name', `%${searchTerm}%`)
            .limit(4),
        ]);

        if (productsResult.error) {
          console.error('Error searching products:', productsResult.error);
        }
        if (brandsResult.error) {
          console.error('Error searching brands:', brandsResult.error);
        }

        const products = Array.isArray(productsResult.data) ? productsResult.data as ProductWithVariants[] : [];
        const brands = Array.isArray(brandsResult.data) ? brandsResult.data as Brand[] : [];

        const brandProductResults = await supabase
          .from('brands')
          .select('id')
          .ilike('name', `%${searchTerm}%`);

        if (brandProductResults.data && Array.isArray(brandProductResults.data) && brandProductResults.data.length > 0) {
          const brandIds = brandProductResults.data.map((b: { id: string }) => b.id);
          const { data: brandProducts } = await supabase
            .from('products')
            .select('*, brand:brands(*), variants:product_variants(*)')
            .in('brand_id', brandIds)
            .limit(6);

          if (brandProducts && Array.isArray(brandProducts)) {
            const existingIds = new Set(products.map((p) => p.id));
            const uniqueBrandProducts = (brandProducts as ProductWithVariants[]).filter(
              (p) => p && !existingIds.has(p.id)
            );
            products.push(...uniqueBrandProducts.slice(0, 6 - products.length));
          }
        }

        setResults({
          products: products.slice(0, 6),
          brands: brands.slice(0, 4),
        });
      } catch (error) {
        console.error('Search error:', error);
        setResults({ products: [], brands: [] });
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchAll, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleClear = () => {
    setQuery('');
    setResults({ products: [], brands: [] });
    setIsOpen(false);
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
    setResults({ products: [], brands: [] });
  };

  const getProductPrice = (product: ProductWithVariants) => {
    if (product && product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      const prices = product.variants.map((v) => Number(v.price));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      if (minPrice === maxPrice) {
        return `$${minPrice.toFixed(2)}`;
      }
      return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
    }
    return 'Price not available';
  };

  const getProductImage = (product: ProductWithVariants) => {
    if (product && product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      if (firstVariant && firstVariant.images && Array.isArray(firstVariant.images) && firstVariant.images.length > 0) {
        return firstVariant.images[0];
      }
    }
    return '/placeholder-product.jpg';
  };

  const hasResults = (results.products && results.products.length > 0) || (results.brands && results.brands.length > 0);

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a product or brand..."
          className="w-full h-10 pl-4 pr-10 bg-white border border-black/15 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30 transition-all"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-9 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[500px] overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <div className="animate-pulse">Searching...</div>
            </div>
          ) : hasResults ? (
            <div className="py-2">
              {results.brands && results.brands.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                    <Building2 className="w-3 h-3" />
                    Brands
                  </div>
                  {results.brands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/brand/${brand.slug}`}
                      onClick={handleResultClick}
                      className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded">
                        <Image
                          src={brand.logo_url}
                          alt={brand.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {brand.name}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {brand.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.products && results.products.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                    <Package className="w-3 h-3" />
                    Products
                  </div>
                  {results.products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}`}
                      onClick={handleResultClick}
                      className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded">
                        <Image
                          src={getProductImage(product)}
                          alt={product.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {product.brand?.name || product.category}
                        </p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {getProductPrice(product)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
