'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { Category, Brand, Collection } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X, Loader2, Plus, Minus } from 'lucide-react';

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
  count: number;
}


export default function CollectionsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [facets, setFacets] = useState<Facet[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set());
  const [openFacets, setOpenFacets] = useState<Record<string, boolean>>({});
  const [offset, setOffset] = useState(0);
  const [limit] = useState(24);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pageType, setPageType] = useState<'category' | 'collection' | 'tag' | null>(null);
  const [matchedCategory, setMatchedCategory] = useState<Category | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [categoriesResult, brandsResult, collectionsResult] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('brands').select('*').order('name'),
        supabase
          .from('collections')
          .select('*')
          .eq('display_on_home', true)
          .order('sort_order'),
      ]);

      setCategories(categoriesResult.data || []);
      setBrands(brandsResult.data || []);
      setCollections(collectionsResult.data || []);

      const allCategories = categoriesResult.data || [];
      const allCollections = collectionsResult.data || [];

      const category = allCategories.find((c: Category) => c.slug === slug);
      if (category) {
        setPageType('category');
        setMatchedCategory(category);
        setTitle(category.name);
        setDescription(category.description || `Explore our ${category.name} products`);
        await fetchFacets();
        setLoading(false);
        return;
      }

      const collection = allCollections.find((c: Collection) => c.slug === slug);
      if (collection) {
        setPageType('collection');
        setTitle(collection.name);
        setDescription(`Explore our ${collection.name} collection`);
        await fetchCollectionProducts(collection);
        setLoading(false);
        return;
      }

      setPageType('tag');
      const titleFromTag = slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setTitle(titleFromTag);
      setDescription(`Explore our ${titleFromTag.toLowerCase()} products`);
      await fetchTagProducts();
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
    if (pageType === 'category' && matchedCategory) {
      fetchProducts(0, false);
    }
  }, [pageType, matchedCategory, selectedOptionIds]);

  useEffect(() => {
    if (pageType === 'category') {
      fetchFacets();
    }
  }, [pageType, selectedOptionIds]);

  const fetchFacets = async () => {
    try {
      const optionIdsParam = Array.from(selectedOptionIds).join(',');
      const url = `/api/storefront/category/facets?categorySlug=${slug}${
        optionIdsParam ? `&selectedOptionIds=${optionIdsParam}` : ''
      }`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch facets');
      const data = await response.json();
      const fetchedFacets = data.facets || [];
      setFacets(fetchedFacets);

      if (Object.keys(openFacets).length === 0 && fetchedFacets.length > 0) {
        const initialOpenState: Record<string, boolean> = {};
        fetchedFacets.forEach((facet: Facet, index: number) => {
          initialOpenState[facet.id] = index < 2;
        });
        setOpenFacets(initialOpenState);
      }
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

  const fetchCollectionProducts = async (collection: Collection) => {
    try {
      const [productsResult, reviewsResult] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            brand:brands(*),
            variants:product_variants(*)
          `)
          .eq('archived', false),

        supabase.from('reviews').select('product_id, rating'),
      ]);

      if (productsResult.error) throw productsResult.error;

      const reviewsByProduct: Record<string, any[]> = {};
      (reviewsResult.data || []).forEach((review: any) => {
        if (!reviewsByProduct[review.product_id]) {
          reviewsByProduct[review.product_id] = [];
        }
        reviewsByProduct[review.product_id].push(review);
      });

      const allProducts = productsResult.data || [];

      let collectionProducts: any[] = [];

      if (collection.product_ids?.length) {
        collectionProducts = [
          ...allProducts.filter((p: any) => collection.product_ids.includes(p.id)),
        ];
      }

      if (collection.product_tags?.length) {
        const tagMatches = allProducts.filter(
          (p: any) =>
            p.tags?.some((tag: string) => collection.product_tags.includes(tag))
        );

        const existing = new Set(collectionProducts.map((p) => p.id));
        collectionProducts = [
          ...collectionProducts,
          ...tagMatches.filter((p) => !existing.has(p.id)),
        ];
      }

      const productsWithRatings = collectionProducts.map((p: any) => {
        const reviews = reviewsByProduct[p.id] || [];
        const average_rating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : undefined;
        return {
          ...p,
          average_rating,
          review_count: reviews.length,
        };
      });

      setProducts(productsWithRatings);
      setTotal(collectionProducts.length);
      setHasMore(collectionProducts.length > limit);
      setOffset(0);
    } catch (error) {
      console.error('Error fetching collection products:', error);
    }
  };

  const fetchTagProducts = async () => {
    try {
      const tagNormalized = slug.toLowerCase().replace(/-/g, '_');
      const [productsResult, reviewsResult] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            brand:brands(*),
            variants:product_variants(*)
          `)
          .eq('archived', false),

        supabase.from('reviews').select('product_id, rating'),
      ]);

      if (productsResult.error) throw productsResult.error;

      const reviewsByProduct: Record<string, any[]> = {};
      (reviewsResult.data || []).forEach((review: any) => {
        if (!reviewsByProduct[review.product_id]) {
          reviewsByProduct[review.product_id] = [];
        }
        reviewsByProduct[review.product_id].push(review);
      });

      const allProducts = productsResult.data || [];

      const tagProducts = allProducts.filter((product: any) => {
        if (!product || !product.tags || !Array.isArray(product.tags)) return false;
        return product.tags.some((t: string) =>
          t && typeof t === 'string' && t.toLowerCase().replace(/-/g, '_') === tagNormalized
        );
      });

      const productsWithRatings = tagProducts.map((p: any) => {
        const reviews = reviewsByProduct[p.id] || [];
        const average_rating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : undefined;
        return {
          ...p,
          average_rating,
          review_count: reviews.length,
        };
      });

      setProducts(productsWithRatings);
      setTotal(tagProducts.length);
      setHasMore(tagProducts.length > limit);
      setOffset(0);
    } catch (error) {
      console.error('Error fetching tag products:', error);
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
      ? `/collections/${slug}?options=${optionsParam}`
      : `/collections/${slug}`;
    router.push(newUrl, { scroll: false });
  };

  const clearFilters = () => {
    setSelectedOptionIds(new Set());
    router.push(`/collections/${slug}`, { scroll: false });
  };

  const toggleFacet = (facetId: string) => {
    setOpenFacets(prev => ({
      ...prev,
      [facetId]: !prev[facetId],
    }));
  };

  const hasActiveFilters = selectedOptionIds.size > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-light tracking-wide mb-3">{title}</h1>
            {description && (
              <p className="text-gray-600 text-lg">{description}</p>
            )}
          </div>

          <div className="flex gap-6">
            {pageType === 'category' && facets.length > 0 && (
              <aside className="w-72 shrink-0">
                <div className="sticky top-4">
                  <div className="flex items-center justify-between mb-6">
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

                  <div className="space-y-0">
                    {facets.map((facet, index) => (
                      <div key={facet.id}>
                        {index > 0 && (
                          <div className="border-b border-gray-200/70 my-4" />
                        )}
                        <div className="py-4">
                          <div
                            className="flex items-center justify-between cursor-pointer mb-3"
                            onClick={() => toggleFacet(facet.id)}
                          >
                            <h3 className="text-base font-semibold tracking-wide">
                              {facet.name}
                            </h3>
                            {openFacets[facet.id] ? (
                              <Minus className="w-4 h-4 text-gray-500" />
                            ) : (
                              <Plus className="w-4 h-4 text-gray-500" />
                            )}
                          </div>

                          {openFacets[facet.id] && (
                            <div className="space-y-2">
                              {facet.options.map((option) => (
                                <div
                                  key={option.id}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={option.id}
                                      checked={selectedOptionIds.has(option.id)}
                                      onCheckedChange={() => toggleOption(option.id)}
                                      disabled={option.count === 0}
                                    />
                                    <Label
                                      htmlFor={option.id}
                                      className={`text-sm font-normal cursor-pointer ${
                                        option.count === 0
                                          ? 'text-gray-400'
                                          : ''
                                      }`}
                                    >
                                      {option.label}
                                    </Label>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {option.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            )}

            <div className="flex-1 max-w-5xl mx-auto">
              {pageType === 'category' && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    Showing {products.length} of {total} {total === 1 ? 'product' : 'products'}
                  </p>
                </div>
              )}

              {products.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {hasMore && pageType === 'category' && (
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
                      : 'No products found in this collection.'}
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
