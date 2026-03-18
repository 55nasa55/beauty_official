import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendOrderConfirmationEmail } from "@/lib/email";

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
  // PERIOD CALCULATOR (YEARLY ONLY)
  //
  function computePeriodEnd(subscription: any) {
    const anchor = subscription.billing_cycle_anchor;
    if (!anchor) return null;

    const end = new Date(anchor * 1000);
    end.setFullYear(end.getFullYear() + 1);
    return end.toISOString();
  }

  //
  // MEMBERSHIP SYNC
  //
  async function syncMembership(subscription: any) {
    const userId = subscription.metadata?.user_id;
    if (!userId) return;

    const priceId = subscription.items?.data?.[0]?.price?.id;
    if (!priceId) return;

    const { data: plan } = await supabase
      .from("membership_plans")
      .select("id")
      .eq("stripe_price_id", priceId)
      .maybeSingle();

    if (!plan) return;

    const currentPeriodEnd = computePeriodEnd(subscription);
    if (!currentPeriodEnd) return;

    let status = "active";
    let endedAt: string | null = null;

    if (["active", "trialing"].includes(subscription.status)) {
      status = "active";
    } else if (["past_due", "unpaid"].includes(subscription.status)) {
      status = "past_due";
    } else if (subscription.status === "canceled" || subscription.status === "incomplete_expired") {
      if (subscription.cancel_at_period_end) {
        status = "active";
      } else {
        status = "canceled";
        endedAt = currentPeriodEnd;
      }
    }

    const data = {
      user_id: userId,
      plan_id: plan.id,
      status,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      ended_at: endedAt,
      updated_at: new Date().toISOString(),
    };

    await supabase.from("memberships").upsert(data, { onConflict: "user_id" });
    console.log("✅ Membership updated:", data);
  }

  //
  // SUBSCRIPTION EVENTS
  //
  if (event.type === "customer.subscription.created") {
    await syncMembership(event.data.object);
  }

  if (event.type === "customer.subscription.updated") {
    await syncMembership(event.data.object);
  }

  //
  // ORDER CREATION — Restored & Fixed
  //
  if (event.type === "checkout.session.completed") {
    console.log("=== STRIPE RAW SESSION ===");
    console.log(JSON.stringify(event.data.object, null, 2));
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("🧾 checkout.session.completed received. Mode:", session.mode);

    // MEMBERSHIP CHECKOUT — DO NOT CREATE ORDER HERE
    if (session.mode === "subscription") {
      console.log("➡️ Subscription checkout — skipping order creation");
      return NextResponse.json({ received: true });
    }

    // PRODUCT CHECKOUT — CREATE ORDER
    try {
      const { data: existing } = await supabase
        .from("orders")
        .select("id")
        .eq("order_number", session.id)
        .maybeSingle();

      if (existing) {
        console.log("Order already exists");
        return NextResponse.json({ received: true });
      }

      const retrievedSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items.data.price.product"],
      });
      const full = session as any;

      const lineItems = retrievedSession.line_items?.data || [];

      const orderData = {
        order_number: full.id,
        user_id: full.client_reference_id || null,
        stripe_session_id: full.id,
        stripe_payment_intent: full.payment_intent ?? null,
        status: full.payment_status === "paid" ? "paid" : "pending",
        payment_status: full.payment_status === "paid" ? "paid" : "pending",
        shipping_status: "Processing",
        tracking_number: null,
        total_amount: (full.amount_total ?? 0) / 100,
        tax_amount: (full.total_details?.amount_tax ?? 0) / 100,
        currency: full.currency,
        customer_email: full.customer_details?.email ?? null,
        customer_name: full.customer_details?.name ?? null,
        shipping_address:
          full.collected_information?.shipping_details?.address ||
          full.shipping_details?.address ||
          full.customer_details?.address ||
          null,
        billing_address: full.customer_details?.address ?? null,
        tax_details: full.total_details?.breakdown ?? null,
      };

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert(orderData)
        .select("id, public_order_number")
        .single();

      if (orderErr || !order) {
        console.error("❌ Failed to create order:", orderErr);
        return NextResponse.json({ received: true });
      }

      const items = lineItems.map((item: any) => {
        const product = item.price?.product;
        const total = (item.amount_total ?? 0) / 100;
        const qty = item.quantity ?? 1;

        return {
          order_id: order.id,
          product_id: product?.metadata?.product_id ?? null,
          variant_id: product?.metadata?.variant_id ?? null,
          product_name: product?.name,
          variant_name: item.description,
          quantity: qty,
          price: total / qty,
        };
      });

      const { data: insertedItems } = await supabase
        .from("order_items")
        .insert(items)
        .select();

      // ------------------------------
      // Atomic Inventory Decrement
      // ------------------------------
      console.log("Webhook: Beginning atomic stock decrement");

      const { data: orderItems, error: orderItemsError } = await supabase
        .from("order_items")
        .select("variant_id, quantity")
        .eq("order_id", order.id);

      if (orderItemsError) {
        console.error("Error fetching order items:", orderItemsError);
        throw orderItemsError;
      }

      for (const item of orderItems) {
        const { variant_id, quantity } = item;

        // Atomic decrement: stock_quantity = stock_quantity - quantity
        const { data: updatedStock, error: rpcError } = await supabase.rpc(
          "adjust_variant_stock",
          {
            p_variant_id: variant_id,
            p_adjustment: -quantity
          }
        );

        if (rpcError) {
          console.error(`Stock decrement FAILED for variant ${variant_id}`, rpcError);
          throw rpcError;
        }

        // Log audit entry
        const { error: auditError } = await supabase
          .from("inventory_adjustments")
          .insert({
            variant_id,
            change_amount: -quantity,
            reason: "webhook_sale",
            created_by: null
          });

        if (auditError) {
          console.error("Inventory audit log failed:", auditError);
        }

        console.log(
          `Stock updated for variant ${variant_id}: -${quantity} (new ${updatedStock})`
        );
      }

      // ------------------------------
      // Send Confirmation Email Immediately
      // ------------------------------
      try {
        const emailItems = items.map((item: any) => ({
          product_name: item.product_name || 'Product',
          quantity: item.quantity,
          price: item.price,
        }));

        await sendOrderConfirmationEmail(
          {
            order_number: orderData.order_number,
            public_order_number: order.public_order_number,
            customer_name: orderData.customer_name || 'Customer',
            customer_email: orderData.customer_email || '',
            shipping_address: orderData.shipping_address,
            billing_address: orderData.billing_address,
            total: orderData.total_amount,
            id: order.id,
          },
          emailItems
        );
        console.log("✅ Confirmation email sent immediately");
      } catch (emailError) {
        console.error("❌ Failed to send confirmation email:", emailError);
      }

      // ------------------------------
      // Create Queue Job for Veeqo
      // ------------------------------
      try {
        await supabase.from("order_sync_jobs").insert({
          order_id: order.id,
          job_type: "push_to_veeqo",
          status: "pending",
        });
        console.log("✅ Veeqo sync job created");
      } catch (jobError) {
        console.error("❌ Failed to create Veeqo sync job:", jobError);
      }

      console.log("✅ Order created:", order.id);
      return NextResponse.json({ received: true });
    } catch (err) {
      console.error("❌ Order creation failed:", err);
      return NextResponse.json({ received: true });
    }
  }

  return NextResponse.json({ received: true });
}