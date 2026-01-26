import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err: any) {
    console.error("❌ Webhook signature failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  //
  //  ---------------------------------------------------------------------------
  //  HELPERS
  //  ---------------------------------------------------------------------------
  //

  const mapSubscriptionStatus = (sub: any) => {
    if (sub.status === "active" || sub.status === "trialing") return "active";
    if (sub.status === "past_due" || sub.status === "unpaid") return "past_due";

    // canceled cases
    if (sub.status === "canceled" || sub.status === "incomplete_expired") {
      if (sub.cancel_at_period_end) {
        return "active"; // still active until period end
      }
      return "canceled";
    }

    return "canceled";
  };

  const extractCurrentPeriodEnd = (sub: any) => {
    if (!sub.current_period_end) return null;
    return new Date(sub.current_period_end * 1000).toISOString();
  };

  const upsertMembership = async (sub: any) => {
    const userId = sub.metadata?.user_id;

    if (!userId) {
      console.error("❌ No user_id in subscription metadata");
      return;
    }

    const priceId = sub.items.data[0]?.price.id;

    if (!priceId) {
      console.error("❌ No price ID found for subscription");
      return;
    }

    const { data: plan } = await supabase
      .from("membership_plans")
      .select("id")
      .eq("stripe_price_id", priceId)
      .maybeSingle();

    if (!plan) {
      console.error("❌ No matching membership plan for price:", priceId);
      return;
    }

    const currentPeriodEndISO = extractCurrentPeriodEnd(sub);

    const status = mapSubscriptionStatus(sub);

    const endedAt =
      status === "canceled" ? currentPeriodEndISO : null;

    const membershipData = {
      user_id: userId,
      plan_id: plan.id,
      status,
      stripe_customer_id: sub.customer,
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId,
      current_period_end: currentPeriodEndISO,
      cancel_at_period_end: sub.cancel_at_period_end || false,
      ended_at: endedAt,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("memberships")
      .upsert(membershipData, { onConflict: "user_id" });

    if (error) {
      console.error("❌ Failed to upsert membership:", error);
    } else {
      console.log("✅ Membership upserted:", membershipData);
    }
  };

  //
  //  ---------------------------------------------------------------------------
  //  SUBSCRIPTION CREATED
  //  ---------------------------------------------------------------------------
  //

  if (event.type === "customer.subscription.created") {
    const subscription = event.data.object;
    console.log("➡️ customer.subscription.created");
    await upsertMembership(subscription);
    return NextResponse.json({ received: true });
  }

  //
  //  ---------------------------------------------------------------------------
  //  SUBSCRIPTION UPDATED
  //  ---------------------------------------------------------------------------
  //

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    console.log("➡️ customer.subscription.updated");
    await upsertMembership(subscription);
    return NextResponse.json({ received: true });
  }

  //
  //  ---------------------------------------------------------------------------
  //  OTHER EVENTS (ignored)
  //  ---------------------------------------------------------------------------
  //

  return NextResponse.json({ received: true });
}