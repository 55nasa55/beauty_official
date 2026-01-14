"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading membership plans...</div>
      </div>
    );
  }

  const primaryPlan = plans[0];

  if (!primaryPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-gray-400 text-lg">No membership plans available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800/20 via-transparent to-transparent"></div>

      <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/20 mb-4">
              <Sparkles className="w-4 h-4 text-[#39ff14]" />
              <span className="text-sm text-[#39ff14] font-medium">Exclusive Access</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Exclusive Pricing.
              <br />
              <span className="text-gray-300">Members Only.</span>
            </h1>

            <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
              Cosmetic Club Plus unlocks reduced pricing on every product — automatically applied at checkout.
            </p>
          </div>

          <div
            className="group relative bg-gradient-to-br from-gray-900 to-black rounded-2xl border-2 border-[#39ff14] p-8 lg:p-12 transition-all duration-300 hover:shadow-[0_0_30px_rgba(57,255,20,0.15)] hover:scale-[1.02]"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#39ff14] to-[#2ecc40] rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-300"></div>

            <div className="relative space-y-8">
              <div className="text-center space-y-3">
                <h2 className="text-3xl lg:text-4xl font-bold text-white">
                  Cosmetic Club Plus
                </h2>
                <p className="text-gray-400 text-base">
                  Annual Membership
                </p>
              </div>

              {primaryPlan.amount_cents && (
                <div className="text-center py-6 border-y border-gray-800">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-6xl lg:text-7xl font-bold text-white tracking-tight">
                      ${(primaryPlan.amount_cents / 100).toFixed(0)}
                    </span>
                    <span className="text-2xl text-gray-400 font-light">
                      / year
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Billed annually</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#39ff14]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#39ff14]"></div>
                  </div>
                  <span className="text-gray-300 leading-relaxed">
                    Exclusive member pricing on every product
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#39ff14]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#39ff14]"></div>
                  </div>
                  <span className="text-gray-300 leading-relaxed">
                    Automatic savings applied at checkout
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#39ff14]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#39ff14]"></div>
                  </div>
                  <span className="text-gray-300 leading-relaxed">
                    Early access to new product launches
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#39ff14]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#39ff14]"></div>
                  </div>
                  <span className="text-gray-300 leading-relaxed">
                    Priority customer support
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleJoinNow(primaryPlan.stripe_price_id)}
                disabled={checkingOut === primaryPlan.stripe_price_id}
                className="w-full py-4 px-6 rounded-xl bg-[#39ff14] text-black font-semibold text-lg hover:bg-[#2ecc40] transition-all duration-300 hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#39ff14] disabled:hover:shadow-none"
              >
                {checkingOut === primaryPlan.stripe_price_id
                  ? "Redirecting to checkout..."
                  : user
                  ? "Join Cosmetic Club Plus"
                  : "Log in to Join"}
              </button>

              <div className="flex flex-col items-center gap-2 text-sm text-gray-500 pt-4">
                <p>Cancel anytime</p>
                <p className="text-xs">Member pricing applied automatically at checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
