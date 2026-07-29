"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Category, Brand, Collection } from "@/lib/database.types";
import {
  Tag,
  Package,
  Truck,
  Heart,
  UserPlus,
  ShoppingBag,
  ShieldCheck,
  Eye,
  Users,
  RefreshCw,
} from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-white">
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1">
        {/* Hero */}
        <div
          className="hero text-center"
          style={{
            background: "linear-gradient(135deg, var(--blush-pink) 0%, var(--soft-rose) 100%)",
            padding: "100px 5% 80px",
          }}
        >
          <p
            className="hero-eyebrow"
            style={{
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "var(--charcoal)",
              opacity: 0.6,
              marginBottom: "20px",
            }}
          >
            About CosClub
          </p>
          <h1
            className="font-heading"
            style={{
              fontSize: "52px",
              fontWeight: 700,
              lineHeight: 1.15,
              color: "var(--charcoal)",
              marginBottom: "24px",
            }}
          >
            Health &amp; beauty products
            <br />
            shouldn&apos;t cost this much.
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "var(--charcoal)",
              opacity: 0.75,
              maxWidth: "560px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            We built CosClub because great skincare deserves to be accessible — not a luxury. A
            membership built on fair prices, not markups.
          </p>
        </div>

        {/* Story */}
        <div
          className="story-section grid grid-cols-1 md:grid-cols-2"
          style={{
            gap: "80px",
            alignItems: "center",
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "100px 5%",
          }}
        >
          {/* Story Visual (left in HTML) */}
          <div
            className="story-visual flex flex-col"
            style={{
              background: "linear-gradient(135deg, #f5f9fe, var(--blush-pink))",
              borderRadius: "20px",
              padding: "48px 40px",
              gap: "28px",
            }}
          >
            <div className="stat-item flex items-center" style={{ gap: "20px" }}>
              <div
                className="stat-icon flex items-center justify-center"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "white",
                  color: "var(--soft-rose)",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(169,201,236,0.25)",
                }}
              >
                <Tag size={22} />
              </div>
              <div className="stat-text">
                <div
                  className="stat-num font-heading"
                  style={{ fontSize: "26px", fontWeight: 700, color: "var(--charcoal)" }}
                >
                  Up to 40%
                </div>
                <div className="stat-desc" style={{ fontSize: "13px", color: "var(--gray)", marginTop: "2px" }}>
                  Off retail price, every day
                </div>
              </div>
            </div>

            <div className="stat-item flex items-center" style={{ gap: "20px" }}>
              <div
                className="stat-icon flex items-center justify-center"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "white",
                  color: "var(--soft-rose)",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(169,201,236,0.25)",
                }}
              >
                <Package size={22} />
              </div>
              <div className="stat-text">
                <div
                  className="stat-num font-heading"
                  style={{ fontSize: "26px", fontWeight: 700, color: "var(--charcoal)" }}
                >
                  $6.99 / mo
                </div>
                <div className="stat-desc" style={{ fontSize: "13px", color: "var(--gray)", marginTop: "2px" }}>
                  Membership — cancel anytime
                </div>
              </div>
            </div>

            <div className="stat-item flex items-center" style={{ gap: "20px" }}>
              <div
                className="stat-icon flex items-center justify-center"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "white",
                  color: "var(--soft-rose)",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(169,201,236,0.25)",
                }}
              >
                <Truck size={22} />
              </div>
              <div className="stat-text">
                <div
                  className="stat-num font-heading"
                  style={{ fontSize: "26px", fontWeight: 700, color: "var(--charcoal)" }}
                >
                  Free shipping
                </div>
                <div className="stat-desc" style={{ fontSize: "13px", color: "var(--gray)", marginTop: "2px" }}>
                  On member orders over $55
                </div>
              </div>
            </div>

            <div className="stat-item flex items-center" style={{ gap: "20px" }}>
              <div
                className="stat-icon flex items-center justify-center"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "white",
                  color: "var(--soft-rose)",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(169,201,236,0.25)",
                }}
              >
                <Heart size={22} />
              </div>
              <div className="stat-text">
                <div
                  className="stat-num font-heading"
                  style={{ fontSize: "26px", fontWeight: 700, color: "var(--charcoal)" }}
                >
                  Hand-picked
                </div>
                <div className="stat-desc" style={{ fontSize: "13px", color: "var(--gray)", marginTop: "2px" }}>
                  Every product earns its place
                </div>
              </div>
            </div>
          </div>

          {/* Story Text (right in HTML) */}
          <div className="story-text">
            <p
              className="story-label"
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "var(--soft-rose)",
                marginBottom: "16px",
              }}
            >
              Our Story
            </p>
            <h2
              className="font-heading"
              style={{ fontSize: "36px", fontWeight: 700, lineHeight: 1.25, marginBottom: "24px" }}
            >
              We got tired of paying retail.
            </h2>
            <p style={{ fontSize: "15px", color: "var(--gray)", lineHeight: 1.85, marginBottom: "18px" }}>
              K-beauty and J-beauty products had a problem — by the time they reached Western shelves,
              the prices had doubled, sometimes tripled. Brands we loved were sitting behind markups that
              had nothing to do with quality and everything to do with distribution.
            </p>
            <p style={{ fontSize: "15px", color: "var(--gray)", lineHeight: 1.85, marginBottom: "18px" }}>
              So we built a different kind of store.{" "}
              <strong style={{ color: "var(--charcoal)" }}>
                CosClub is a members-only beauty shop
              </strong>{" "}
              that sources directly and passes the savings straight to you. No inflated retail prices.
              No mystery markups. Just the products you love, at prices that actually make sense.
            </p>
            <p style={{ fontSize: "15px", color: "var(--gray)", lineHeight: 1.85, marginBottom: 0 }}>
              Our catalogue is deliberately curated — every product earns its place based on ingredients,
              reviews, and community feedback. We&apos;d rather carry 200 exceptional products than 2,000
              average ones.
            </p>
          </div>
        </div>

        {/* Mission */}
        <div
          className="mission-section text-center"
          style={{ background: "var(--charcoal)", padding: "100px 5%" }}
        >
          <p
            className="label"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "var(--blush-pink)",
              marginBottom: "20px",
            }}
          >
            Our Mission
          </p>
          <h2
            className="font-heading"
            style={{
              fontSize: "42px",
              fontWeight: 700,
              color: "white",
              maxWidth: "700px",
              margin: "0 auto 24px",
              lineHeight: 1.2,
            }}
          >
            Make world-class beauty accessible to everyone.
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "#A0A0A0",
              maxWidth: "580px",
              margin: "0 auto",
              lineHeight: 1.8,
            }}
          >
            The best skincare routines shouldn&apos;t require a luxury budget. CosClub exists to close
            the gap between what K-beauty and J-beauty products actually cost and what consumers are
            asked to pay for them.
          </p>
        </div>

        {/* How It Works */}
        <div className="how-section" style={{ padding: "100px 5%", maxWidth: "1100px", margin: "0 auto" }}>
          <div className="section-header text-center" style={{ marginBottom: "64px" }}>
            <p
              className="label"
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "var(--soft-rose)",
                marginBottom: "16px",
              }}
            >
              How It Works
            </p>
            <h2 className="font-heading" style={{ fontSize: "38px", fontWeight: 700 }}>
              Simple by design.
            </h2>
            <p
              style={{
                fontSize: "15px",
                color: "var(--gray)",
                marginTop: "14px",
                maxWidth: "480px",
                marginLeft: "auto",
                marginRight: "auto",
                lineHeight: 1.7,
              }}
            >
              CosClub runs on a straightforward membership model — no points systems, no tiers, no
              confusion.
            </p>
          </div>

          <div className="steps grid grid-cols-1 md:grid-cols-3" style={{ gap: "40px" }}>
            <div className="step text-center">
              <div
                className="step-number flex items-center justify-center font-heading"
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--blush-pink), var(--soft-rose))",
                  color: "var(--charcoal)",
                  fontSize: "20px",
                  fontWeight: 700,
                  margin: "0 auto 20px",
                }}
              >
                1
              </div>
              <div
                className="step-icon flex justify-center"
                style={{ color: "var(--soft-rose)", marginBottom: "16px" }}
              >
                <UserPlus size={32} />
              </div>
              <h3 className="font-heading" style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>
                Join for $6.99/mo
              </h3>
              <p style={{ fontSize: "14px", color: "var(--gray)", lineHeight: 1.75 }}>
                Sign up and get instant access to member pricing across our entire catalogue. Cancel
                anytime — no commitment required.
              </p>
            </div>

            <div className="step text-center">
              <div
                className="step-number flex items-center justify-center font-heading"
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--blush-pink), var(--soft-rose))",
                  color: "var(--charcoal)",
                  fontSize: "20px",
                  fontWeight: 700,
                  margin: "0 auto 20px",
                }}
              >
                2
              </div>
              <div
                className="step-icon flex justify-center"
                style={{ color: "var(--soft-rose)", marginBottom: "16px" }}
              >
                <ShoppingBag size={32} />
              </div>
              <h3 className="font-heading" style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>
                Shop at member prices
              </h3>
              <p style={{ fontSize: "14px", color: "var(--gray)", lineHeight: 1.75 }}>
                Every product in our store shows both the retail price and your member price side by
                side. Savings are immediate and automatic — no codes needed.
              </p>
            </div>

            <div className="step text-center">
              <div
                className="step-number flex items-center justify-center font-heading"
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--blush-pink), var(--soft-rose))",
                  color: "var(--charcoal)",
                  fontSize: "20px",
                  fontWeight: 700,
                  margin: "0 auto 20px",
                }}
              >
                3
              </div>
              <div
                className="step-icon flex justify-center"
                style={{ color: "var(--soft-rose)", marginBottom: "16px" }}
              >
                <Package size={32} />
              </div>
              <h3 className="font-heading" style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>
                Get free shipping at $55+
              </h3>
              <p style={{ fontSize: "14px", color: "var(--gray)", lineHeight: 1.75 }}>
                Members qualify for free shipping on orders over $55. We operate on razor-thin margins
                to keep prices low — $55 is the minimum we need to absorb shipping without passing the
                cost on to you. Most orders ship within 1–3 business days.
              </p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div
          className="values-section"
          style={{
            background: "#fafcff",
            borderTop: "1px solid var(--light-gray)",
            borderBottom: "1px solid var(--light-gray)",
            padding: "80px 5%",
          }}
        >
          <div className="values-inner" style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div className="section-header text-center">
              <p
                className="label"
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  color: "var(--soft-rose)",
                  marginBottom: "16px",
                }}
              >
                What We Stand For
              </p>
              <h2 className="font-heading" style={{ fontSize: "38px", fontWeight: 700 }}>
                The CosClub standards.
              </h2>
            </div>

            <div
              className="values-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              style={{ gap: "32px", marginTop: "56px" }}
            >
              <div
                className="value-card"
                style={{
                  padding: "28px 24px",
                  background: "white",
                  borderRadius: "14px",
                  border: "1px solid var(--light-gray)",
                }}
              >
                <ShieldCheck size={24} style={{ color: "var(--soft-rose)", marginBottom: "16px", display: "block" }} />
                <h4
                  className="font-heading"
                  style={{ fontSize: "16px", fontWeight: 700, marginBottom: "10px" }}
                >
                  Ingredient Integrity
                </h4>
                <p style={{ fontSize: "13px", color: "var(--gray)", lineHeight: 1.7 }}>
                  We only carry products we&apos;d use ourselves. Every product is reviewed for
                  ingredient quality before it makes our catalogue.
                </p>
              </div>

              <div
                className="value-card"
                style={{
                  padding: "28px 24px",
                  background: "white",
                  borderRadius: "14px",
                  border: "1px solid var(--light-gray)",
                }}
              >
                <Eye size={24} style={{ color: "var(--soft-rose)", marginBottom: "16px", display: "block" }} />
                <h4
                  className="font-heading"
                  style={{ fontSize: "16px", fontWeight: 700, marginBottom: "10px" }}
                >
                  Price Transparency
                </h4>
                <p style={{ fontSize: "13px", color: "var(--gray)", lineHeight: 1.7 }}>
                  We show you the retail price alongside the member price on every product. You always
                  know exactly what you&apos;re saving.
                </p>
              </div>

              <div
                className="value-card"
                style={{
                  padding: "28px 24px",
                  background: "white",
                  borderRadius: "14px",
                  border: "1px solid var(--light-gray)",
                }}
              >
                <Users size={24} style={{ color: "var(--soft-rose)", marginBottom: "16px", display: "block" }} />
                <h4
                  className="font-heading"
                  style={{ fontSize: "16px", fontWeight: 700, marginBottom: "10px" }}
                >
                  Community-Driven
                </h4>
                <p style={{ fontSize: "13px", color: "var(--gray)", lineHeight: 1.7 }}>
                  Members help shape our catalogue. Products are added based on community votes and
                  feedback — not just what&apos;s trending.
                </p>
              </div>

              <div
                className="value-card"
                style={{
                  padding: "28px 24px",
                  background: "white",
                  borderRadius: "14px",
                  border: "1px solid var(--light-gray)",
                }}
              >
                <RefreshCw size={24} style={{ color: "var(--soft-rose)", marginBottom: "16px", display: "block" }} />
                <h4
                  className="font-heading"
                  style={{ fontSize: "16px", fontWeight: 700, marginBottom: "10px" }}
                >
                  No Strings Attached
                </h4>
                <p style={{ fontSize: "13px", color: "var(--gray)", lineHeight: 1.7 }}>
                  Cancel anytime from your dashboard. No cancellation fees, no hoops to jump through, no
                  guilt-trip emails.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-section text-center" style={{ padding: "100px 5%" }}>
          <h2 className="font-heading" style={{ fontSize: "40px", fontWeight: 700, marginBottom: "16px" }}>
            Ready to pay less for the
            <br />
            products you love?
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "var(--gray)",
              marginBottom: "36px",
              maxWidth: "440px",
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.7,
            }}
          >
            Join thousands of members already saving up to 40% on their favourite K-beauty and J-beauty
            products.
          </p>
          <div className="cta-buttons flex flex-wrap justify-center" style={{ gap: "14px" }}>
            <Link
              href="/pricing"
              className="btn-primary inline-block"
              style={{
                background: "var(--baby-blue)",
                color: "var(--charcoal)",
                padding: "16px 36px",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "16px",
                fontFamily: "var(--font-manrope), var(--body-font)",
                border: "none",
                transition: "background 0.2s",
              }}
            >
              Join CosClub — $6.99/mo
            </Link>
            <Link
              href="/browse"
              className="btn-ghost inline-block"
              style={{
                background: "transparent",
                color: "var(--charcoal)",
                padding: "16px 36px",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "16px",
                fontFamily: "var(--font-manrope), var(--body-font)",
                border: "2px solid var(--light-gray)",
                transition: "all 0.2s",
              }}
            >
              Browse the shop
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
