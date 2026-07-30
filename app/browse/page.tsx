"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ProductListItem } from "@/components/ProductListItem";
import { Category, Brand, Collection } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { ChevronRight, LayoutGrid, List, Loader as Loader2, X, Chrome as Home } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type ViewMode = "grid" | "list";

export default function BrowseAllPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

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
  const [brandSearch, setBrandSearch] = useState("");

  // Sorting
  const [sort, setSort] = useState("newest");

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Apply category from URL param on initial load
  useEffect(() => {
    if (categoryParam) {
      // Try to match a category
      loadInitialData().then(({ categories: cats }) => {
        const matched = cats.find(
          (c) => c.name.toLowerCase() === categoryParam.toLowerCase() || c.slug === categoryParam
        );
        if (matched) {
          setSelectedCategories(new Set([matched.id]));
        }
      });
    } else {
      loadInitialData();
    }
  }, [categoryParam]);

  useEffect(() => {
    if (categories.length > 0 || brands.length > 0) {
      fetchProducts(0, false);
    }
  }, [selectedBrands, selectedCategories, sort]);

  async function loadInitialData(): Promise<{ categories: Category[] }> {
    setLoading(true);

    const [categoriesResult, brandsResult, collectionsResult] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("brands").select("*").order("name"),
      supabase.from("collections").select("*").order("sort_order"),
    ]);

    const cats = categoriesResult.data || [];
    setCategories(cats);
    setBrands(brandsResult.data || []);
    setCollections(collectionsResult.data || []);

    setLoading(false);
    return { categories: cats };
  }

  async function fetchProducts(newOffset: number, append: boolean) {
    if (append) setLoadingMore(true);

    try {
      let query = supabase
        .from("products")
        .select(
          `
          *,
          brand:brands(*),
          variants:product_variants(*)
        `,
          { count: "exact" }
        )
        .or("archived.is.null,archived.eq.false");

      if (selectedBrands.size > 0) {
        query = query.in("brand_id", Array.from(selectedBrands));
      }
      if (selectedCategories.size > 0) {
        query = query.in("category_id", Array.from(selectedCategories));
      }

      switch (sort) {
        case "low":
          query = query.order("created_at", { ascending: false });
          break;
        case "high":
          query = query.order("created_at", { ascending: false });
          break;
        case "rating":
          query = query.order("created_at", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error, count } = await query.range(newOffset, newOffset + limit - 1);

      if (error) throw error;

      if (!data || data.length === 0) {
        if (append) {
          setProducts((prev) => [...prev]);
        } else {
          setProducts([]);
        }
        setTotal(count || 0);
        setHasMore(false);
        setOffset(newOffset);
        return;
      }

      const productIds = data.map((p: any) => p.id);

      const reviewsResult = await supabase
        .from("reviews")
        .select("product_id, rating")
        .in("product_id", productIds);

      const reviewsByProduct: Record<string, any[]> = {};
      (reviewsResult.data || []).forEach((review: any) => {
        if (!reviewsByProduct[review.product_id]) {
          reviewsByProduct[review.product_id] = [];
        }
        reviewsByProduct[review.product_id].push(review);
      });

      let processed = data.map((p: any) => {
        const reviews = reviewsByProduct[p.id] || [];
        const average_rating =
          reviews.length > 0
            ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
            : undefined;

        return {
          ...p,
          average_rating,
          review_count: reviews.length,
        };
      });

      // Client-side sorting for price and rating (requires variant/review data)
      if (sort === "low") {
        processed.sort((a: any, b: any) => {
          const aPrice = a.variants?.[0]?.price ?? Infinity;
          const bPrice = b.variants?.[0]?.price ?? Infinity;
          return aPrice - bPrice;
        });
      } else if (sort === "high") {
        processed.sort((a: any, b: any) => {
          const aPrice = a.variants?.[0]?.price ?? 0;
          const bPrice = b.variants?.[0]?.price ?? 0;
          return bPrice - aPrice;
        });
      } else if (sort === "rating") {
        processed.sort((a: any, b: any) => (b.average_rating || 0) - (a.average_rating || 0));
      }

      if (append) {
        setProducts((prev) => [...prev, ...processed]);
      } else {
        setProducts(processed);
      }

      setTotal(count || 0);
      setHasMore(newOffset + limit < (count || 0));
      setOffset(newOffset);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      if (append) setLoadingMore(false);
    }
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

  const removeBrandFilter = useCallback((brandId: string) => {
    toggleSet(brandId, setSelectedBrands);
  }, []);

  const removeCategoryFilter = useCallback((categoryId: string) => {
    toggleSet(categoryId, setSelectedCategories);
  }, []);

  function clearAllFilters() {
    setSelectedBrands(new Set());
    setSelectedCategories(new Set());
  }

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase().trim())
  );

  const pageTitle = categoryParam || "All Products";

  // Active filter chips
  const activeChips: { label: string; onRemove: () => void }[] = [];
  selectedCategories.forEach((id) => {
    const cat = categories.find((c) => c.id === id);
    if (cat) activeChips.push({ label: cat.name, onRemove: () => removeCategoryFilter(id) });
  });
  selectedBrands.forEach((id) => {
    const brand = brands.find((b) => b.id === id);
    if (brand) activeChips.push({ label: brand.name, onRemove: () => removeBrandFilter(id) });
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "var(--gray)" }}>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} brands={brands} collections={collections} />

      {/* Page Header */}
      <div className="page-header" style={{ padding: "32px 5% 24px", borderBottom: "1px solid var(--light-gray)" }}>
        <div className="breadcrumb" style={{ fontSize: "13px", color: "var(--gray)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Link href="/" style={{ color: "var(--gray)" }}>
            <Home size={14} style={{ display: "inline", verticalAlign: "middle" }} />
          </Link>
          <ChevronRight size={14} style={{ color: "var(--gray)" }} />
          <span>{pageTitle}</span>
        </div>
        <div className="page-title-row" style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
          <h1 className="font-heading" style={{ fontSize: "32px", fontWeight: 700, margin: 0 }}>
            {pageTitle}
          </h1>
          <span className="result-count" style={{ color: "var(--gray)", fontSize: "15px" }}>
            {total} {total === 1 ? "result" : "results"}
          </span>
        </div>
        {activeChips.length > 0 && (
          <div className="active-filters" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px", alignItems: "center" }}>
            {activeChips.map((chip, i) => (
              <button
                key={i}
                onClick={chip.onRemove}
                className="filter-chip"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "var(--blush-pink)",
                  color: "var(--charcoal)",
                  fontSize: "13px",
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  border: "none",
                  transition: "background 0.2s",
                }}
              >
                {chip.label} <X size={14} />
              </button>
            ))}
            <button
              onClick={clearAllFilters}
              className="clear-all"
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--coral)",
                cursor: "pointer",
                background: "none",
                border: "none",
                marginLeft: "4px",
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Shop Layout */}
      <div className="shop-layout" style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>
        {/* Sidebar */}
        <aside className="browse-sidebar" style={{
          width: "260px",
          minWidth: "260px",
          padding: "32px 24px",
          borderRight: "1px solid var(--light-gray)",
          position: "sticky",
          top: "65px",
          maxHeight: "calc(100vh - 65px)",
          overflowY: "auto",
        }}>
          {/* Category */}
          <div className="sidebar-section" style={{ marginBottom: "36px" }}>
            <h3 style={{
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "var(--gray)",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              marginBottom: "16px",
            }}>
              Category
            </h3>
            {categories.map((c) => (
              <label key={c.id} className="filter-option" style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
              }}>
                <input
                  type="checkbox"
                  checked={selectedCategories.has(c.id)}
                  onChange={() => toggleSet(c.id, setSelectedCategories)}
                  style={{ accentColor: "var(--soft-rose)", width: "16px", height: "16px", cursor: "pointer" }}
                />
                {c.name}
              </label>
            ))}
          </div>

          {/* Brand */}
          <div className="sidebar-section" style={{ marginBottom: "36px" }}>
            <h3 style={{
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "var(--gray)",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              marginBottom: "16px",
            }}>
              Brand
            </h3>
            <input
              type="text"
              placeholder="Search brands..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1.5px solid var(--light-gray)",
                borderRadius: "6px",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--charcoal)",
                outline: "none",
                marginBottom: "14px",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--blush-pink)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--light-gray)")}
            />
            <div className="brand-list" style={{ maxHeight: "220px", overflowY: "auto" }}>
              {filteredBrands.length === 0 && (
                <div style={{ fontSize: "13px", color: "var(--gray)", padding: "4px 0" }}>
                  No brands found
                </div>
              )}
              {filteredBrands.map((b) => (
                <label key={b.id} className="filter-option" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                }}>
                  <input
                    type="checkbox"
                    checked={selectedBrands.has(b.id)}
                    onChange={() => toggleSet(b.id, setSelectedBrands)}
                    style={{ accentColor: "var(--soft-rose)", width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  {b.name}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Area */}
        <div className="product-area" style={{ flex: 1, padding: "24px 32px" }}>
          {/* Top Bar */}
          <div className="top-bar" style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
            gap: "16px",
            flexWrap: "wrap",
          }}>
            <div className="top-bar-left" style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--gray)" }}>Sort by:</span>
              <select
                className="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{
                  padding: "9px 14px",
                  border: "1.5px solid var(--light-gray)",
                  borderRadius: "6px",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--charcoal)",
                  background: "white",
                  outline: "none",
                  cursor: "pointer",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--blush-pink)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--light-gray)")}
              >
                <option value="newest">Best Sellers</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
                <option value="rating">Most Reviewed</option>
              </select>
            </div>
            <div className="top-bar-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="view-toggle" style={{ display: "flex", border: "1.5px solid var(--light-gray)", borderRadius: "6px", overflow: "hidden" }}>
                <button
                  className={`view-btn${viewMode === "grid" ? " active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                  style={{
                    padding: "8px 12px",
                    background: viewMode === "grid" ? "var(--blush-pink)" : "white",
                    border: "none",
                    cursor: "pointer",
                    color: viewMode === "grid" ? "var(--charcoal)" : "var(--gray)",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  className={`view-btn${viewMode === "list" ? " active" : ""}`}
                  onClick={() => setViewMode("list")}
                  title="List view"
                  style={{
                    padding: "8px 12px",
                    background: viewMode === "list" ? "var(--blush-pink)" : "white",
                    border: "none",
                    cursor: "pointer",
                    color: viewMode === "list" ? "var(--charcoal)" : "var(--gray)",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid View */}
          {viewMode === "grid" ? (
            <div className="product-grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          ) : (
            <div className="product-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {products.map((p) => (
                <ProductListItem key={p.id} product={p as any} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {products.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ fontSize: "16px", color: "var(--gray)" }}>No products found.</p>
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "48px" }}>
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
      </div>

      <Footer />

      {/* Responsive overrides for browse page */}
      <style>{`
        @media (max-width: 900px) {
          .browse-sidebar { display: none !important; }
          .product-area { padding: 20px 5% !important; }
        }
      `}</style>
    </div>
  );
}
