'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProductWithVariants } from '@/lib/database.types';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductWithVariants[]>([]);
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
    const searchProducts = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      setIsOpen(true);

      try {
        const searchTerm = query.trim().toLowerCase();

        const { data, error } = await supabase
          .from('products')
          .select('*, brand:brands(*), variants:product_variants(*)')
          .or(
            `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`
          )
          .limit(8);

        if (error) throw error;

        const productsWithVariants = data as ProductWithVariants[];

        const brandResults = await supabase
          .from('brands')
          .select('id, name')
          .ilike('name', `%${searchTerm}%`);

        if (brandResults.data && brandResults.data.length > 0) {
          const brandIds = brandResults.data.map((b: { id: string; name: string }) => b.id);
          const { data: brandProducts } = await supabase
            .from('products')
            .select('*, brand:brands(*), variants:product_variants(*)')
            .in('brand_id', brandIds)
            .limit(8);

          if (brandProducts) {
            const existingIds = new Set(productsWithVariants.map((p) => p.id));
            const uniqueBrandProducts = (brandProducts as ProductWithVariants[]).filter(
              (p) => !existingIds.has(p.id)
            );
            productsWithVariants.push(...uniqueBrandProducts.slice(0, 8 - productsWithVariants.length));
          }
        }

        setResults(productsWithVariants.slice(0, 8));
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const getProductPrice = (product: ProductWithVariants) => {
    if (product.variants && product.variants.length > 0) {
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
    if (product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      if (firstVariant.images && Array.isArray(firstVariant.images) && firstVariant.images.length > 0) {
        return firstVariant.images[0];
      }
    }
    return '/placeholder-product.jpg';
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[500px] overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <div className="animate-pulse">Searching...</div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((product) => (
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
          ) : query.trim().length >= 2 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No products found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
