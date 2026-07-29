"use client";

import Link from "next/link";
import { ProductCard } from "./ProductCard";
import { ProductWithVariants } from "@/lib/database.types";

interface ProductCarouselProps {
  title: string;
  products: ProductWithVariants[];
  viewMoreSlug?: string;
}

export function ProductCarousel({ title, products, viewMoreSlug }: ProductCarouselProps) {
  if (products.length === 0) return null;

  return (
    <div className="section">
      {/* section-header — h2 left, View All link right */}
      <div className="section-header">
        <h2>{title}</h2>
        {viewMoreSlug && (
          <Link
            href={`/collections/${viewMoreSlug}`}
            style={{ fontWeight: 700, color: 'var(--coral)', fontSize: 15 }}
          >
            View All →
          </Link>
        )}
      </div>

      {/* product-grid — 5 equal columns on desktop, 14px gap */}
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
