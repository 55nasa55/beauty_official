"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Category, Brand, Collection } from "@/lib/database.types";
import { ShoppingBag, Tag, Monitor, Shield, Check } from "lucide-react";

export default function AboutPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    loadHeaderData();
  }, []);

  async function loadHeaderData() {
    const [categoriesResult, brandsResult, collectionsResult] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("brands").select("*").order("name"),
      supabase.from("collections").select("*").order("sort_order"),
    ]);

    setCategories(categoriesResult.data || []);
    setBrands(brandsResult.data || []);
    setCollections(collectionsResult.data || []);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#FFFFFF" }}>
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1">
        {/* SECTION 1 - HERO (Mission Statement) */}
        <section className="w-full py-24 relative">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1
                  className="text-5xl md:text-6xl font-bold mb-6"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Beauty Shopping, Reimagined.
                </h1>
                <p
                  className="text-xl md:text-2xl text-gray-700 leading-relaxed"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  CosClub is a membership-based beauty shopping destination focused on better prices, trusted products, and a smoother online shopping experience.
                </p>
              </div>
              <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Beauty shopping"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 - The Story & Goal (Two-Column Split) */}
        <section className="w-full py-24">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2
                  className="text-4xl md:text-5xl font-bold mb-6"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  We created CosClub…
                </h2>
                <p
                  className="text-lg text-gray-700 leading-relaxed"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  We created CosClub for shoppers who love beauty and skincare but are tired of overpaying. Our goal is to make it easier to shop quality products at prices that feel fair.
                </p>
              </div>
              <div className="w-full flex justify-center py-12">
                <svg
                  width="360"
                  height="220"
                  viewBox="0 0 360 220"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full max-w-[360px]"
                >
                  {/* Member Price Layer */}
                  <rect x="40" y="90" width="280" height="110" rx="14" fill="#9DCBF3" />
                  <text
                    x="180"
                    y="155"
                    textAnchor="middle"
                    fontFamily="Inter"
                    fontSize="22"
                    fontWeight="700"
                    fill="white"
                  >
                    Member Price
                  </text>

                  {/* Standard Price */}
                  <rect
                    x="40"
                    y="40"
                    width="260"
                    height="100"
                    rx="12"
                    fill="white"
                    stroke="#E5E7EB"
                    strokeWidth="1.5"
                  />
                  <text
                    x="170"
                    y="100"
                    textAnchor="middle"
                    fontFamily="Inter"
                    fontSize="18"
                    fontWeight="600"
                    fill="#444"
                  >
                    Standard Price
                  </text>

                  {/* Peel Fold */}
                  <path d="M300 40 L345 60 L300 80 Z" fill="#F3F4F6" />
                  <path
                    d="M300 40 C315 50 315 70 300 80"
                    stroke="#D1D5DB"
                    strokeWidth="1"
                  />

                  {/* Blue Reveal Behind Fold */}
                  <path d="M300 40 L345 60 L300 80 Z" fill="#9DCBF3" opacity="0.35" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 - What Makes Us Different (4-Item Feature Grid) */}
        <section
          className="w-full py-24"
          style={{ backgroundColor: "#F4F9FF" }}
        >
          <div className="max-w-[1200px] mx-auto px-4">
            <h2
              className="text-4xl md:text-5xl font-bold text-center mb-16"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              What Makes Us Different
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {/* Feature 1 */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <ShoppingBag size={48} style={{ color: "#9DCBF3" }} strokeWidth={1.5} />
                </div>
                <h4
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Curated beauty-focused catalog
                </h4>
                <p
                  className="text-gray-600 leading-relaxed"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  We focus on products that our customers actually want, not everything under the sun.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Tag size={48} style={{ color: "#9DCBF3" }} strokeWidth={1.5} />
                </div>
                <h4
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Member pricing for better value
                </h4>
                <p
                  className="text-gray-600 leading-relaxed"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Our membership model allows us to offer better prices to our loyal customers.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Monitor size={48} style={{ color: "#9DCBF3" }} strokeWidth={1.5} />
                </div>
                <h4
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  A clean, easy-to-shop experience
                </h4>
                <p
                  className="text-gray-600 leading-relaxed"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  We designed our site to be intuitive, fast, and enjoyable to use.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Shield size={48} style={{ color: "#9DCBF3" }} strokeWidth={1.5} />
                </div>
                <h4
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Transparent savings throughout the site
                </h4>
                <p
                  className="text-gray-600 leading-relaxed"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  We show you exactly what you save as a member, with no hidden tricks.
                </p>
              </div>
            </div>

            <p
              className="text-lg text-center text-gray-700 max-w-[900px] mx-auto leading-relaxed"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              We are building a store designed for both everyday customers and frequent buyers who want consistency, value, and convenience.
            </p>
          </div>
        </section>

        {/* SECTION 4 - Our Mission (High-Impact Typography Block) */}
        <section className="w-full py-24">
          <div className="max-w-[1000px] mx-auto px-4 text-center">
            <h2
              className="text-4xl md:text-5xl font-bold mb-8"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Our Mission
            </h2>
            <p
              className="text-2xl md:text-3xl text-gray-800 leading-relaxed font-light"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              To make beauty shopping more affordable and more enjoyable through smart pricing, curated products, and a membership model that puts value first.
            </p>
          </div>
        </section>

        {/* SECTION 5 - Our Approach (5 Pillars Checklist) */}
        <section
          className="w-full py-24"
          style={{ backgroundColor: "#FAFAFA" }}
        >
          <div className="max-w-[1000px] mx-auto px-4">
            <h2
              className="text-4xl md:text-5xl font-bold text-center mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Our Approach
            </h2>
            <p
              className="text-xl text-center text-gray-700 mb-12"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              We believe great shopping comes from:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[800px] mx-auto">
              {/* Checklist Item 1 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Check size={24} style={{ color: "#9DCBF3" }} strokeWidth={2.5} />
                </div>
                <span
                  className="text-lg text-gray-800"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Clear pricing
                </span>
              </div>

              {/* Checklist Item 2 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Check size={24} style={{ color: "#9DCBF3" }} strokeWidth={2.5} />
                </div>
                <span
                  className="text-lg text-gray-800"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Easy navigation
                </span>
              </div>

              {/* Checklist Item 3 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Check size={24} style={{ color: "#9DCBF3" }} strokeWidth={2.5} />
                </div>
                <span
                  className="text-lg text-gray-800"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Reliable fulfillment
                </span>
              </div>

              {/* Checklist Item 4 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Check size={24} style={{ color: "#9DCBF3" }} strokeWidth={2.5} />
                </div>
                <span
                  className="text-lg text-gray-800"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Products people actually want
                </span>
              </div>

              {/* Checklist Item 5 */}
              <div className="flex items-start gap-4 md:col-span-2 md:justify-center">
                <div className="flex-shrink-0 mt-1">
                  <Check size={24} style={{ color: "#9DCBF3" }} strokeWidth={2.5} />
                </div>
                <span
                  className="text-lg text-gray-800"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  A customer-first experience
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6 - Growth & Final CTA */}
        <section className="w-full py-24">
          <div className="max-w-[1000px] mx-auto px-4 text-center">
            <h2
              className="text-4xl md:text-5xl font-bold mb-8"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Growing With Our Customers
            </h2>
            <p
              className="text-lg text-gray-700 leading-relaxed mb-6 max-w-[800px] mx-auto"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              CosClub is built to grow with our community. As we expand, we will continue improving our product selection, member benefits, and overall shopping experience while staying focused on what matters most: value and trust.
            </p>
            <p
              className="text-xl text-gray-800 mb-10"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Thanks for shopping with us.
            </p>
            <button
              onClick={() => router.push("/browse")}
              className="px-10 py-4 rounded-lg font-semibold text-white text-lg transition-all"
              style={{
                backgroundColor: "#9DCBF3",
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#8BBDEB";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#9DCBF3";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Explore the Collection
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
