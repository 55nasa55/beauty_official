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
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  //
  // UTILITY TO ALWAYS PRODUCE A PERIOD END DATE
  //
  function computePeriodEnd(subscription: any) {
    const anchor = subscription.billing_cycle_anchor;

    if (!anchor) {
      console.error("❌ No billing_cycle_anchor returned");
      return null;
    }

    const end = new Date(anchor * 1000);
    end.setFullYear(end.getFullYear() + 1); // yearly only
    return end.toISOString();
  }

  //
  // CREATE MEMBERSHIP
  //
  async function createOrUpdateMembership(subscription: any) {
    const userId = subscription.metadata?.user_id;
    if (!userId) {
      console.error("❌ No user_id in metadata for subscription", subscription.id);
      return;
    }

    const priceId = subscription.items?.data?.[0]?.price?.id;
    if (!priceId) {
      console.error("❌ No price ID found");
      return;
    }

    const { data: plan } = await supabase
      .from("membership_plans")
      .select("id")
      .eq("stripe_price_id", priceId)
      .maybeSingle();

    if (!plan) {
      console.error("❌ No membership plan matches price:", priceId);
      return;
    }

    // ALWAYS compute period end yourself
    const currentPeriodEnd = computePeriodEnd(subscription);
    if (!currentPeriodEnd) {
      console.error("❌ Could not compute current_period_end");
      return;
    }

    // Determine status
    let membershipStatus = "active";
    let endedAt = null;

    if (subscription.status === "active" || subscription.status === "trialing") {
      membershipStatus = "active";
    } else if (subscription.status === "past_due" || subscription.status === "unpaid") {
      membershipStatus = "past_due";
    } else if (subscription.status === "canceled" || subscription.status === "incomplete_expired") {
      if (subscription.cancel_at_period_end) {
        membershipStatus = "active"; // stays active until end
      } else {
        membershipStatus = "canceled";
        endedAt = currentPeriodEnd;
      }
    }

    const membershipData = {
      user_id: userId,
      plan_id: plan.id,
      status: membershipStatus,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      ended_at: endedAt,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("memberships")
      .upsert(membershipData, { onConflict: "user_id" });

    if (error) console.error("❌ Failed to upsert membership:", error);
    else console.log("✅ Membership synced:", membershipData);
  }

  //
  // EVENTS
  //
  if (event.type === "customer.subscription.created") {
    await createOrUpdateMembership(event.data.object);
  }

  if (event.type === "customer.subscription.updated") {
    await createOrUpdateMembership(event.data.object);
  }

  // Checkout session (orders only)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode === "subscription") {
      return NextResponse.json({ received: true });
    }
    // your existing order handler stays untouched
  }

  return NextResponse.json({ received: true });
}