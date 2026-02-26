"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Category, Brand, Collection } from "@/lib/database.types";
import { Users, TrendingDown, Store, Package } from "lucide-react";

export default function WhyPricesAreLowerPage() {
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
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1">
        {/* SECTION 1 - HERO BANNER */}
        <section
          className="w-full pt-24 pb-24"
          style={{
            background: "linear-gradient(to bottom, #ffffff, #F4F9FF)",
          }}
        >
          <div className="max-w-[1100px] mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              How Membership Pricing Works
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-gray-700">
              CosClub is built to make beauty shopping easier, more affordable, and more transparent.
            </p>
            <p className="text-base text-gray-600 mb-8 max-w-[800px] mx-auto">
              We offer two ways to shop: Guest and Member. Guests can browse and purchase at standard pricing,
              while members unlock lower pricing on eligible products.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push("/pricing")}
                className="px-8 py-3.5 rounded-lg font-semibold text-white transition-colors"
                style={{
                  backgroundColor: "#9DCBF3",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#8BBDEB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#9DCBF3";
                }}
              >
                Join Now
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-8 py-3.5 rounded-lg font-semibold transition-colors"
                style={{
                  border: "1px solid #9DCBF3",
                  color: "#9DCBF3",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#EAF4FF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Browse Products
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 2 - TWO WAYS TO SHOP */}
        <section className="w-full py-20" style={{ backgroundColor: "#F7F8FA" }}>
          <div className="max-w-[1100px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* CARD 1 - Guest */}
              <div
                className="rounded-2xl p-8"
                style={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                }}
              >
                <h3 className="text-2xl font-bold mb-2">Shop as a Guest</h3>
                <p className="font-bold mb-4 text-gray-900">Standard Pricing</p>
                <p className="text-gray-600 leading-relaxed">
                  You can shop the store without a membership and still access our products and standard pricing.
                  This is a great option if you want to explore the store first or make a one-time purchase.
                </p>
              </div>

              {/* CARD 2 - Member */}
              <div
                className="rounded-2xl p-8"
                style={{
                  backgroundColor: "#9DCBF31A",
                  border: "2px solid #9DCBF3",
                }}
              >
                <h3 className="text-2xl font-bold mb-2">Join as a Member</h3>
                <p className="font-bold mb-4 text-gray-900">Exclusive Member Pricing</p>
                <p className="text-gray-600 leading-relaxed">
                  Members get access to lower pricing across eligible products.
                  Throughout the site, we show pricing clearly so you can compare guest pricing and member pricing
                  and see the value of joining.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 - WHY MEMBER PRICES ARE LOWER */}
        <section className="w-full py-20" style={{ backgroundColor: "white" }}>
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              Why Member Prices Are Lower
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Users size={48} style={{ color: "#9DCBF3" }} strokeWidth={1.5} />
                </div>
                <h4 className="text-xl font-bold mb-3">Membership-Based Model</h4>
                <p className="text-gray-600 leading-relaxed">
                  Our membership structure helps us focus on long-term customer value instead of high one-time markups.
                  That allows us to offer better pricing to members.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <TrendingDown size={48} style={{ color: "#9DCBF3" }} strokeWidth={1.5} />
                </div>
                <h4 className="text-xl font-bold mb-3">Smarter Inventory Planning</h4>
                <p className="text-gray-600 leading-relaxed">
                  We stock products based on what our customers actually buy, which helps us plan inventory more
                  efficiently and reduce excess costs.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Store size={48} style={{ color: "#9DCBF3" }} strokeWidth={1.5} />
                </div>
                <h4 className="text-xl font-bold mb-3">Lean Online-First Operations</h4>
                <p className="text-gray-600 leading-relaxed">
                  By operating with a streamlined online model, we keep overhead lower than traditional retail
                  and pass that value back to customers.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Package size={48} style={{ color: "#9DCBF3" }} strokeWidth={1.5} />
                </div>
                <h4 className="text-xl font-bold mb-3">Curated Product Selection</h4>
                <p className="text-gray-600 leading-relaxed">
                  We focus on products that fit our customers&apos; needs instead of carrying everything. A more curated
                  catalog helps us stay efficient and maintain better pricing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 - HOW TO GET STARTED */}
        <section className="w-full py-20" style={{ backgroundColor: "#FAFAFA" }}>
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              How to Get Started
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="text-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4"
                  style={{ backgroundColor: "#9DCBF3" }}
                >
                  1
                </div>
                <h4 className="text-lg font-bold mb-2">Create an account</h4>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4"
                  style={{ backgroundColor: "#9DCBF3" }}
                >
                  2
                </div>
                <h4 className="text-lg font-bold mb-2">Browse products and compare guest vs member pricing</h4>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4"
                  style={{ backgroundColor: "#9DCBF3" }}
                >
                  3
                </div>
                <h4 className="text-lg font-bold mb-2">Join when you&apos;re ready to unlock savings</h4>
              </div>

              {/* Step 4 */}
              <div className="text-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4"
                  style={{ backgroundColor: "#9DCBF3" }}
                >
                  4
                </div>
                <h4 className="text-lg font-bold mb-2">Shop with confidence</h4>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 - WHO COSCLUB IS FOR */}
        <section className="w-full py-20" style={{ backgroundColor: "white" }}>
          <div className="max-w-[1100px] mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Who CosClub Is For</h2>
            <p className="text-lg text-gray-700 mb-6">CosClub is designed for:</p>
            <ul className="text-left max-w-[600px] mx-auto space-y-3">
              <li className="flex items-start gap-3">
                <span
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: "#9DCBF3" }}
                ></span>
                <span className="text-gray-700">Beauty and skincare shoppers</span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: "#9DCBF3" }}
                ></span>
                <span className="text-gray-700">Frequent buyers who want better value</span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: "#9DCBF3" }}
                ></span>
                <span className="text-gray-700">Customers who prefer clear pricing</span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: "#9DCBF3" }}
                ></span>
                <span className="text-gray-700">Anyone looking for a smoother shopping experience</span>
              </li>
            </ul>
          </div>
        </section>

        {/* SECTION 6 - THE BOTTOM LINE */}
        <section className="w-full py-20" style={{ backgroundColor: "#9DCBF3" }}>
          <div className="max-w-[1100px] mx-auto px-4 text-center">
            <p className="text-lg md:text-xl text-white leading-relaxed mb-4">
              CosClub combines a membership pricing model, curated products, and efficient operations to give
              customers a better way to shop for beauty products online.
            </p>
            <p className="text-lg md:text-xl text-white leading-relaxed mb-8">
              You can browse as a guest anytime, and join when you&apos;re ready to unlock member savings.
            </p>
            <button
              onClick={() => router.push("/pricing")}
              className="px-8 py-3.5 rounded-lg font-semibold text-white transition-colors"
              style={{
                border: "2px solid white",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Get Started Today
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
