"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";

interface WishlistContextType {
  wishedProductIds: Set<string>;
  isWished: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<{ error: string | null }>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType>({
  wishedProductIds: new Set<string>(),
  isWished: () => false,
  toggleWishlist: async () => ({ error: "not-implemented" }),
  loading: true,
  refresh: async () => {},
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [wishedProductIds, setWishedProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadWishlist = useCallback(async () => {
    if (!user) {
      setWishedProductIds(new Set());
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("wishlist")
      .select("product_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("[WishlistContext] load error:", error.message);
      setWishedProductIds(new Set());
    } else {
      setWishedProductIds(new Set((data || []).map((r: { product_id: string }) => r.product_id)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    loadWishlist();
  }, [authLoading, loadWishlist]);

  const isWished = useCallback(
    (productId: string) => wishedProductIds.has(productId),
    [wishedProductIds]
  );

  const toggleWishlist = useCallback(
    async (productId: string): Promise<{ error: string | null }> => {
      if (!user) return { error: "not-authenticated" };

      const alreadyWished = wishedProductIds.has(productId);

      // Optimistic update
      setWishedProductIds((prev) => {
        const next = new Set(prev);
        if (alreadyWished) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        if (alreadyWished) {
          const { error } = await supabase
            .from("wishlist")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", productId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("wishlist")
            .insert({ product_id: productId });
          if (error) throw error;
        }
        return { error: null };
      } catch (err: any) {
        // Revert on failure
        setWishedProductIds((prev) => {
          const next = new Set(prev);
          if (alreadyWished) next.add(productId);
          else next.delete(productId);
          return next;
        });
        return { error: err.message || "Failed to update wishlist" };
      }
    },
    [user, wishedProductIds]
  );

  const refresh = useCallback(async () => {
    await loadWishlist();
  }, [loadWishlist]);

  return (
    <WishlistContext.Provider
      value={{ wishedProductIds, isWished, toggleWishlist, loading, refresh }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
