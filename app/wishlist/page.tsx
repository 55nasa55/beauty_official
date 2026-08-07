"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useWishlist } from "@/lib/wishlist-context";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Category, Brand, Collection, ProductWithVariants } from "@/lib/database.types";
import { Heart, ChevronRight, Loader as Loader2 } from "lucide-react";

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { wishedProductIds, loading: wishlistLoading, toggleWishlist } = useWishlist();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Redirect guests to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Load navigation data once
  useEffect(() => {
    async function loadNav() {
      const [cats, brs, cols] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("brands").select("*").order("name"),
        supabase.from("collections").select("*").eq("display_on_home", true).order("sort_order"),
      ]);
      setCategories(cats.data || []);
      setBrands(brs.data || []);
      setCollections(cols.data || []);
    }
    loadNav();
  }, []);

  // Load wishlisted products whenever the wishlist set changes
  useEffect(() => {
    if (!user || wishlistLoading) return;

    async function loadProducts() {
      const ids = Array.from(wishedProductIds);
      if (ids.length === 0) {
        setProducts([]);
        setLoadingProducts(false);
        return;
      }

      setLoadingProducts(true);
      const { data, error } = await supabase
        .from("products")
        .select(`*, brand:brands(*), variants:product_variants(*)`)
        .in("id", ids)
        .or("archived.is.null,archived.eq.false");

      if (error) {
        console.error("[WishlistPage] load error:", error.message);
        setProducts([]);
      } else {
        setProducts((data || []) as ProductWithVariants[]);
      }
      setLoadingProducts(false);
    }

    loadProducts();
  }, [user, wishedProductIds, wishlistLoading]);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1 bg-off-white">
        <div style={{ padding: "32px 5% 24px", borderBottom: "1px solid var(--light-gray)" }}>
          <div
            className="breadcrumb"
            style={{
              fontSize: "13px",
              color: "var(--gray)",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Link href="/" style={{ color: "var(--gray)" }}>
              Home
            </Link>
            <ChevronRight size={14} style={{ color: "var(--gray)" }} />
            <span>Wishlist</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <h1 className="font-heading" style={{ fontSize: "32px", fontWeight: 700, margin: 0 }}>
              My Wishlist
            </h1>
            <span style={{ color: "var(--gray)", fontSize: "15px" }}>
              {products.length} {products.length === 1 ? "item" : "items"}
            </span>
          </div>
        </div>

        <div style={{ padding: "40px 5%" }}>
          {loadingProducts || wishlistLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div
                className="flex items-center justify-center mb-6"
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  background: "var(--blush-pink)",
                }}
              >
                <Heart className="w-10 h-10" style={{ color: "var(--coral)", fill: "var(--coral)" }} />
              </div>
              <h2 className="font-heading text-2xl font-light mb-3">Your wishlist is empty</h2>
              <p className="text-gray-500 mb-8 max-w-md">
                Save your favorite products by tapping the heart icon, and they&apos;ll appear here for easy access later.
              </p>
              <Link href="/browse">
                <Button
                  className="btn-solid"
                  style={{ fontSize: 16, padding: "14px 28px", borderRadius: 8 }}
                >
                  Start Browsing
                </Button>
              </Link>
            </div>
          ) : (
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "24px",
              }}
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
