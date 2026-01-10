"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
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
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading membership plans...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Membership Pricing</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Join our exclusive membership program and unlock special pricing on all products
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {plan.amount_cents && (
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    ${(plan.amount_cents / 100).toFixed(0)}
                  </span>
                  <span className="text-muted-foreground">
                    /{plan.billing_interval}
                  </span>
                </div>
              )}
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Exclusive member pricing on all products</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Save up to 20% or more on select items</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Early access to new products</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Priority customer support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={() => handleJoinNow(plan.stripe_price_id)}
                disabled={checkingOut === plan.stripe_price_id}
              >
                {checkingOut === plan.stripe_price_id
                  ? "Redirecting..."
                  : user
                  ? "Join Now"
                  : "Log in to Join"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center text-muted-foreground">
          No membership plans available at this time
        </div>
      )}
    </div>
  );
}
