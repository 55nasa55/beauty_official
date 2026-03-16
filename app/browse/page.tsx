"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Category, Brand, Collection } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Minus } from "lucide-react";

export default function BrowseAllPage() {
  // Header data
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Product state
  const [products, setProducts] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(24);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  // Sorting
  const [sort, setSort] = useState("newest");

  // Facet UI state
  const [openFilters, setOpenFilters] = useState({
    brands: true,
    categories: true,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchProducts(0, false);
  }, [selectedBrands, selectedCategories, sort]);

  async function loadInitialData() {
    setLoading(true);

    const [categoriesResult, brandsResult, collectionsResult] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("brands").select("*").order("name"),
      supabase.from("collections").select("*").order("sort_order"),
    ]);

    setCategories(categoriesResult.data || []);
    setBrands(brandsResult.data || []);
    setCollections(collectionsResult.data || []);

    await fetchProducts(0, false);
    setLoading(false);
  }

  function buildQueryFilters(query: any) {
    if (selectedBrands.size > 0) {
      query = query.in("brand_id", Array.from(selectedBrands));
    }
    if (selectedCategories.size > 0) {
      query = query.in("category_id", Array.from(selectedCategories));
    }
    return query;
  }

  async function fetchProducts(newOffset: number, append: boolean) {
    if (append) setLoadingMore(true);

    let query = supabase
      .from("products")
      .select(
        `
        *,
        brand:brands(*),
        variants:product_variants(*),
        reviews:reviews(rating)
      `,
        { count: "exact" }
      )
      .eq("archived", false);

    query = buildQueryFilters(query);

    switch (sort) {
      case "low":
        query = query.order("price", { ascending: true, referencedTable: "product_variants" });
        break;
      case "high":
        query = query.order("price", { ascending: false, referencedTable: "product_variants" });
        break;
      case "rating":
        // We'll sort after computing average_rating
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const { data, error, count } = await query.range(newOffset, newOffset + limit - 1);

    if (!error && data) {
      const processed = data.map((p) => {
        const ratings = p.reviews?.map((r: any) => r.rating) || [];
        const average_rating =
          ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b) / ratings.length : undefined;

        return {
          ...p,
          average_rating,
          review_count: ratings.length,
        };
      });

      let finalData = processed;

      if (sort === "rating") {
        finalData = processed.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      }

      if (append) {
        setProducts((prev) => [...prev, ...finalData]);
      } else {
        setProducts(finalData);
      }

      setTotal(count || 0);
      setHasMore(newOffset + limit < (count || 0));
      setOffset(newOffset);
    }

    if (append) setLoadingMore(false);
  }

  function toggleSet(value: string, setFunc: any) {
    setFunc((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(value)) newSet.delete(value);
      else newSet.add(value);
      return newSet;
    });
  }

  function handleLoadMore() {
    fetchProducts(offset + limit, true);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 flex gap-8">
        {/* FILTERS SIDEBAR */}
        <aside className="w-64 hidden lg:block">
          <div className="sticky top-24">
            {/* Brands */}
            <div className="mb-6">
              <div
                className="flex justify-between items-center cursor-pointer mb-2"
                onClick={() =>
                  setOpenFilters((prev) => ({ ...prev, brands: !prev.brands }))
                }
              >
                <h3 className="text-lg font-semibold">Brands</h3>
                {openFilters.brands ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>

              {openFilters.brands && (
                <div className="space-y-2">
                  {brands.map((b) => (
                    <div key={b.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedBrands.has(b.id)}
                        onCheckedChange={() => toggleSet(b.id, setSelectedBrands)}
                      />
                      <Label>{b.name}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="mb-6">
              <div
                className="flex justify-between items-center cursor-pointer mb-2"
                onClick={() =>
                  setOpenFilters((prev) => ({ ...prev, categories: !prev.categories }))
                }
              >
                <h3 className="text-lg font-semibold">Categories</h3>
                {openFilters.categories ? (
                  <Minus className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </div>

              {openFilters.categories && (
                <div className="space-y-2">
                  {categories.map((c) => (
                    <div key={c.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedCategories.has(c.id)}
                        onCheckedChange={() => toggleSet(c.id, setSelectedCategories)}
                      />
                      <Label>{c.name}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1">
          {/* Sorting */}
          <div className="flex justify-end mb-6">
            <select
              className="border px-3 py-2 rounded-md text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="low">Price: Low → High</option>
              <option value="high">Price: High → Low</option>
              <option value="rating">Rating: High → Low</option>
            </select>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-12">
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
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
