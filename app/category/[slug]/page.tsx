'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { Category, Brand, Collection } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X, Loader2 } from 'lucide-react';

interface Facet {
  id: string;
  name: string;
  slug: string;
  options: FacetOption[];
}

interface FacetOption {
  id: string;
  label: string;
  value: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  category: string;
  image: string;
  price: number;
  compareAtPrice: number | null;
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [facets, setFacets] = useState<Facet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set());
  const [offset, setOffset] = useState(0);
  const [limit] = useState(24);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [categoriesResult, brandsResult, collectionsResult, categoryResult] =
        await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase.from('brands').select('*').order('name'),
          supabase
            .from('collections')
            .select('*')
            .eq('display_on_home', true)
            .order('sort_order'),
          supabase.from('categories').select('*').eq('slug', slug).maybeSingle(),
        ]);

      setCategories(categoriesResult.data || []);
      setBrands(brandsResult.data || []);
      setCollections(collectionsResult.data || []);

      const cat = categoryResult.data as Category | null;
      setCategory(cat);

      if (cat) {
        await fetchFacets();
      }

      setLoading(false);
    }

    fetchData();
  }, [slug]);

  useEffect(() => {
    const optionsParam = searchParams.get('options');
    if (optionsParam) {
      const optionIds = optionsParam.split(',').filter(id => id.trim());
      setSelectedOptionIds(new Set(optionIds));
    } else {
      setSelectedOptionIds(new Set());
    }
  }, [searchParams]);

  useEffect(() => {
    if (category) {
      fetchProducts(0, false);
    }
  }, [category, selectedOptionIds]);

  const fetchFacets = async () => {
    try {
      const response = await fetch(
        `/api/storefront/category/facets?categorySlug=${slug}`
      );
      if (!response.ok) throw new Error('Failed to fetch facets');
      const data = await response.json();
      setFacets(data.facets || []);
    } catch (error) {
      console.error('Error fetching facets:', error);
    }
  };

  const fetchProducts = async (newOffset: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    }

    try {
      const optionIdsParam = Array.from(selectedOptionIds).join(',');
      const url = `/api/storefront/category/products?categorySlug=${slug}&offset=${newOffset}&limit=${limit}${
        optionIdsParam ? `&optionIds=${optionIdsParam}` : ''
      }`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();

      if (append) {
        setProducts(prev => [...prev, ...data.products]);
      } else {
        setProducts(data.products);
      }

      setOffset(newOffset);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const newOffset = offset + limit;
    fetchProducts(newOffset, true);
  };

  const toggleOption = (optionId: string) => {
    const newSelected = new Set(selectedOptionIds);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    updateSelectedOptions(newSelected);
  };

  const updateSelectedOptions = (newSelected: Set<string>) => {
    setSelectedOptionIds(newSelected);
    const optionsParam = Array.from(newSelected).join(',');
    const newUrl = optionsParam
      ? `/category/${slug}?options=${optionsParam}`
      : `/category/${slug}`;
    router.push(newUrl, { scroll: false });
  };

  const clearFilters = () => {
    setSelectedOptionIds(new Set());
    router.push(`/category/${slug}`, { scroll: false });
  };

  const hasActiveFilters = selectedOptionIds.size > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Category not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-light tracking-wide mb-3">{category.name}</h1>
            {category.description && (
              <p className="text-gray-600 text-lg">{category.description}</p>
            )}
          </div>

          <div className="flex gap-8">
            {facets.length > 0 && (
              <aside className="w-72 shrink-0">
                <div className="sticky top-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-sm"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>

                  <div className="space-y-6">
                    {facets.map((facet) => (
                      <div key={facet.id} className="space-y-3">
                        <h3 className="font-medium text-sm">{facet.name}</h3>
                        <div className="space-y-2">
                          {facet.options.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={option.id}
                                checked={selectedOptionIds.has(option.id)}
                                onCheckedChange={() => toggleOption(option.id)}
                              />
                              <Label
                                htmlFor={option.id}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            )}

            <div className="flex-1">
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Showing {products.length} of {total} {total === 1 ? 'product' : 'products'}
                </p>
              </div>

              {products.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => {
                      const productWithVariants = {
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        description: product.description,
                        category: product.category,
                        brand: { name: product.brand },
                        variants: [
                          {
                            id: '',
                            product_id: product.id,
                            name: '',
                            price: product.price,
                            compare_at_price: product.compareAtPrice,
                            images: product.image ? [product.image] : [],
                            specs: {},
                            sku: '',
                            created_at: '',
                            updated_at: '',
                          },
                        ],
                      };
                      return (
                        <ProductCard key={product.id} product={productWithVariants as any} />
                      );
                    })}
                  </div>

                  {hasMore && (
                    <div className="mt-8 flex justify-center">
                      <Button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        size="lg"
                        variant="outline"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {hasActiveFilters
                      ? 'No products match your filters. Try adjusting your selection.'
                      : 'No products found in this category.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
