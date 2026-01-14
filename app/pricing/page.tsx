"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAuth } from "@/lib/auth-context";

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  stripe_price_id: string;
  billing_interval: string;
  amount_cents: number | null;
  is_active: boolean;
  sort_order: number;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("membership_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setPlans(data);
    }
    setLoading(false);
  };

  const handleJoinNow = async (priceId: string) => {
    if (!user) {
      router.push("/login?redirect=/pricing");
      return;
    }

    setCheckingOut(priceId);

    try {
      const response = await fetch("/api/membership/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session");
        setCheckingOut(null);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout");
      setCheckingOut(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF8F6] to-[#F5F0EB] flex items-center justify-center">
        <div className="text-[#6B5D56] text-lg">Loading membership plans...</div>
      </div>
    );
  }

  const primaryPlan = plans[0];

  if (!primaryPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF8F6] to-[#F5F0EB] flex items-center justify-center">
        <div className="text-[#6B5D56] text-lg">No membership plans available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F6] to-[#F5F0EB]">
      <div className="container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#8B7D78] hover:text-[#6B5D56] transition-colors mb-8"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Shop
          </Link>
          <div className="text-center mb-16 space-y-5">
            <h1 className="text-4xl lg:text-5xl font-light text-[#3A3231] tracking-wide">
              Exclusive member pricing
            </h1>

            <p className="text-base lg:text-lg text-[#6B5D56] max-w-lg mx-auto leading-relaxed">
              Cosmetic Club Plus members enjoy preferred pricing across our entire collection,
              automatically applied at checkout.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E6A6B0] shadow-[0_8px_30px_rgba(230,166,176,0.12)] p-8 lg:p-12">
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl lg:text-3xl font-medium text-[#3A3231] tracking-wide">
                  Cosmetic Club Plus
                </h2>
                <p className="text-[#8B7D78] text-sm tracking-wide uppercase">
                  Annual Membership
                </p>
              </div>

              {primaryPlan.amount_cents && (
                <div className="text-center py-8 border-y border-[#F3E5E0]">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl lg:text-6xl font-light text-[#3A3231] tracking-tight">
                      ${(primaryPlan.amount_cents / 100).toFixed(0)}
                    </span>
                    <span className="text-xl text-[#8B7D78] font-light">
                      / year
                    </span>
                  </div>
                  <p className="text-sm text-[#A89891] mt-3">Billed annually</p>
                </div>
              )}

              <div className="space-y-4 py-4">
                <div className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E6A6B0] flex-shrink-0 mt-2.5"></div>
                  <span className="text-[#5A4D48] leading-relaxed">
                    Exclusive member pricing on every product
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E6A6B0] flex-shrink-0 mt-2.5"></div>
                  <span className="text-[#5A4D48] leading-relaxed">
                    Automatic savings applied at checkout
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E6A6B0] flex-shrink-0 mt-2.5"></div>
                  <span className="text-[#5A4D48] leading-relaxed">
                    Early access to new product launches
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E6A6B0] flex-shrink-0 mt-2.5"></div>
                  <span className="text-[#5A4D48] leading-relaxed">
                    Priority customer support
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleJoinNow(primaryPlan.stripe_price_id)}
                disabled={checkingOut === primaryPlan.stripe_price_id}
                className="w-full py-4 px-6 rounded-full bg-[#E6A6B0] text-white font-medium text-base tracking-wide hover:bg-[#D89AA4] transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#E6A6B0] disabled:hover:shadow-sm"
              >
                {checkingOut === primaryPlan.stripe_price_id
                  ? "Redirecting to checkout..."
                  : user
                  ? "Join Cosmetic Club Plus"
                  : "Log in to Join"}
              </button>

              <div className="flex flex-col items-center gap-1.5 text-sm text-[#A89891] pt-2">
                <p>Cancel anytime</p>
                <p className="text-xs">Member pricing applied automatically</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
