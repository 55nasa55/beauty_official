import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  console.log('[Webhook] ========== WEBHOOK REQUEST RECEIVED ==========');

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('[Webhook] ERROR: No signature provided');
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log('[Webhook] ✓ Signature verified successfully');
    console.log('[Webhook] Event type:', event.type);
    console.log('[Webhook] Event ID:', event.id);
  } catch (err: any) {
    console.error('[Webhook] ❌ Signature verification FAILED:', err.message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // ============================================================================
  // checkout.session.completed
  // Handles payment mode (orders only - subscriptions handled by subscription events)
  // ============================================================================
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('[Webhook] Processing checkout.session.completed');
    console.log('[Webhook] Session ID:', session.id);
    console.log('[Webhook] Mode:', session.mode);

    // Subscriptions are handled by customer.subscription.created
    if (session.mode === 'subscription') {
      console.log('[Webhook] Subscription checkout - will be handled by subscription.created event');
      return NextResponse.json({ received: true });
    }

    // Handle payment mode - create order
    console.log('[Webhook] Payment checkout - creating order');
    console.log('[Webhook] Payment status:', session.payment_status);

    try {
      // Check for duplicate order
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('order_number', session.id)
        .maybeSingle();

      if (existingOrder) {
        console.log('[Webhook] Order already exists, skipping creation');
        return NextResponse.json({ received: true, orderId: existingOrder.id });
      }

      // Retrieve full session with line items
      const retrievedSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items.data.price.product'],
      });
      const fullSession = retrievedSession as any;

      const lineItems = fullSession.line_items?.data || [];

      if (lineItems.length === 0) {
        console.error('[Webhook] No line items found in session');
        return NextResponse.json({ received: true });
      }

      // Extract customer and address information
      const customerEmail = fullSession.customer_details?.email || null;
      const customerName = fullSession.customer_details?.name || null;

      const shippingAddress = fullSession.shipping_details?.address
        ? {
            name: fullSession.shipping_details.name || null,
            line1: fullSession.shipping_details.address.line1 || '',
            line2: fullSession.shipping_details.address.line2 || null,
            city: fullSession.shipping_details.address.city || '',
            state: fullSession.shipping_details.address.state || '',
            postal_code: fullSession.shipping_details.address.postal_code || '',
            country: fullSession.shipping_details.address.country || '',
          }
        : null;

      const billingAddress = fullSession.customer_details?.address
        ? {
            line1: fullSession.customer_details.address.line1 || '',
            line2: fullSession.customer_details.address.line2 || null,
            city: fullSession.customer_details.address.city || '',
            state: fullSession.customer_details.address.state || '',
            postal_code: fullSession.customer_details.address.postal_code || '',
            country: fullSession.customer_details.address.country || '',
          }
        : null;

      const totalAmount = (fullSession.amount_total || 0) / 100;
      const taxAmount = (fullSession.total_details?.amount_tax || 0) / 100;
      const currency = fullSession.currency || 'usd';

      const orderData = {
        order_number: fullSession.id,
        user_id: fullSession.client_reference_id || null,
        stripe_session_id: fullSession.id,
        stripe_payment_intent: fullSession.payment_intent as string | null,
        status: fullSession.payment_status === 'paid' ? 'paid' : 'pending',
        payment_status: fullSession.payment_status === 'paid' ? 'paid' : 'pending',
        shipping_status: 'Processing',
        tracking_number: null,
        total_amount: totalAmount,
        tax_amount: taxAmount,
        currency: currency,
        customer_email: customerEmail,
        customer_name: customerName,
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        tax_details: fullSession.total_details?.breakdown || null,
      };

      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select('id')
        .single();

      if (orderError || !order) {
        console.error('[Webhook] Failed to insert order:', orderError);
        return NextResponse.json({ received: true });
      }

      console.log('[Webhook] ✓ Order created:', order.id);

      // Insert order items
      const orderItems = lineItems.map((item: any) => {
        const product = item.price?.product as Stripe.Product;
        const quantity = item.quantity || 1;
        const itemTotal = (item.amount_total || 0) / 100;
        const unitPrice = quantity > 0 ? itemTotal / quantity : 0;

        return {
          order_id: order.id,
          product_id: product?.metadata?.product_id || null,
          variant_id: product?.metadata?.variant_id || null,
          product_name: product?.name || 'Unknown Product',
          variant_name: item.description || null,
          quantity: quantity,
          price: unitPrice,
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('[Webhook] Failed to insert order items:', itemsError);
        return NextResponse.json({ received: true });
      }

      console.log('[Webhook] ✓ Order items created:', orderItems.length);
      console.log('[Webhook] ✓ Order complete');

      return NextResponse.json({
        received: true,
        orderId: order.id,
        orderNumber: orderData.order_number,
      });
    } catch (error: any) {
      console.error('[Webhook] Error processing payment checkout:', error.message);
      console.error('[Webhook] Stack trace:', error.stack);
      return NextResponse.json({ received: true });
    }
  }

  // ============================================================================
  // customer.subscription.created
  // Handle new subscription creation
  // ============================================================================
  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object as any;
    console.log('[Webhook] Processing customer.subscription.created');
    console.log('[Webhook] Subscription ID:', subscription.id);
    console.log('[Webhook] Subscription Status:', subscription.status);

    try {
      const priceId = subscription.items.data[0]?.price.id;

      if (!priceId) {
        console.error('[Webhook] No price ID found in subscription');
        return NextResponse.json({ received: true });
      }

      const { data: plan } = await supabase
        .from('membership_plans')
        .select('id')
        .eq('stripe_price_id', priceId)
        .maybeSingle();

      if (!plan) {
        console.log('[Webhook] No matching membership plan for price:', priceId);
        return NextResponse.json({ received: true });
      }

      let userId = subscription.metadata?.user_id;

      if (!userId) {
        try {
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          if ('metadata' in customer) {
            userId = customer.metadata?.user_id;
          }
        } catch (error: any) {
          console.log('[Webhook] Failed to retrieve customer:', error.message);
        }
      }

      if (!userId) {
        const { data: existingMembership } = await supabase
          .from('memberships')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .maybeSingle();

        if (existingMembership) {
          userId = existingMembership.user_id;
        }
      }

      if (!userId) {
        console.error('[Webhook] No user_id found - cannot create membership');
        return NextResponse.json({ received: true });
      }

      const currentPeriodEndISO = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;

      let membershipStatus = 'active';
      if (subscription.status === 'trialing') {
        membershipStatus = 'active';
      } else if (subscription.status === 'past_due') {
        membershipStatus = 'past_due';
      } else if (['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
        membershipStatus = 'canceled';
      }

      const membershipData = {
        user_id: userId,
        plan_id: plan.id,
        status: membershipStatus,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        current_period_end: currentPeriodEndISO,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('memberships')
        .upsert(membershipData, {
          onConflict: 'stripe_subscription_id',
        });

      if (upsertError) {
        console.error('[Webhook] Failed to upsert membership:', upsertError);
        return NextResponse.json({ received: true });
      }

      console.log('[Webhook] ✓ Membership created/updated via subscription.created');
      console.log('[Webhook]   - User ID:', userId);
      console.log('[Webhook]   - Status:', membershipStatus);
      console.log('[Webhook]   - Period End:', currentPeriodEndISO);

      return NextResponse.json({ received: true });
    } catch (error: any) {
      console.error('[Webhook] Error processing subscription.created:', error.message);
      console.error('[Webhook] Stack trace:', error.stack);
      return NextResponse.json({ received: true });
    }
  }

  // ============================================================================
  // customer.subscription.updated
  // Handle subscription status changes
  // ============================================================================
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as any;
    console.log('[Webhook] Processing customer.subscription.updated');
    console.log('[Webhook] Subscription ID:', subscription.id);
    console.log('[Webhook] Subscription Status:', subscription.status);

    try {
      const currentPeriodEndISO = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;

      let membershipStatus = 'active';
      let endedAt = null;

      if (subscription.status === 'trialing' || subscription.status === 'active') {
        membershipStatus = 'active';
      } else if (subscription.status === 'past_due') {
        membershipStatus = 'past_due';
      } else if (['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
        membershipStatus = 'canceled';
        endedAt = new Date().toISOString();
      }

      const updateData: any = {
        status: membershipStatus,
        current_period_end: currentPeriodEndISO,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        updated_at: new Date().toISOString(),
      };

      if (endedAt) {
        updateData.ended_at = endedAt;
      }

      const { error: updateError } = await supabase
        .from('memberships')
        .update(updateData)
        .eq('stripe_subscription_id', subscription.id);

      if (updateError) {
        console.error('[Webhook] Failed to update membership:', updateError);
        return NextResponse.json({ received: true });
      }

      console.log('[Webhook] ✓ Membership updated via subscription.updated');
      console.log('[Webhook]   - Status:', membershipStatus);
      console.log('[Webhook]   - Period End:', currentPeriodEndISO);

      return NextResponse.json({ received: true });
    } catch (error: any) {
      console.error('[Webhook] Error processing subscription.updated:', error.message);
      console.error('[Webhook] Stack trace:', error.stack);
      return NextResponse.json({ received: true });
    }
  }

  // ============================================================================
  // invoice.payment_succeeded
  // Update membership to active status after successful payment
  // ============================================================================
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as any;
    console.log('[Webhook] Processing invoice.payment_succeeded');
    console.log('[Webhook] Invoice ID:', invoice.id);

    const customerId = invoice.customer;

    if (!customerId) {
      console.log('[Webhook] No customer ID in invoice');
      return NextResponse.json({ received: true });
    }

    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id;

    if (!subscriptionId) {
      console.log('[Webhook] No subscription - likely one-time payment');
      return NextResponse.json({ received: true });
    }

    try {
      const currentPeriodEndISO = invoice.lines?.data?.[0]?.period?.end
        ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
        : null;

      console.log('[Webhook] Payment succeeded for subscription');
      console.log('[Webhook]   - Customer ID:', customerId);
      console.log('[Webhook]   - Subscription ID:', subscriptionId);
      console.log('[Webhook]   - Period End:', currentPeriodEndISO);

      const updateData: any = {
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      if (currentPeriodEndISO) {
        updateData.current_period_end = currentPeriodEndISO;
      }

      const { error: updateError } = await supabase
        .from('memberships')
        .update(updateData)
        .eq('stripe_customer_id', customerId);

      if (updateError) {
        console.error('[Webhook] Failed to update membership:', updateError);
        return NextResponse.json({ received: true });
      }

      console.log('[Webhook] ✓ Membership updated to active');

      return NextResponse.json({ received: true });
    } catch (error: any) {
      console.error('[Webhook] Error processing invoice payment:', error.message);
      console.error('[Webhook] Stack trace:', error.stack);
      return NextResponse.json({ received: true });
    }
  }

  // ============================================================================
  // invoice.payment_failed
  // Update membership to past_due status after failed payment
  // ============================================================================
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as any;
    console.log('[Webhook] Processing invoice.payment_failed');
    console.log('[Webhook] Invoice ID:', invoice.id);

    const customerId = invoice.customer;

    if (!customerId) {
      console.log('[Webhook] No customer ID in invoice');
      return NextResponse.json({ received: true });
    }

    try {
      console.log('[Webhook] Payment failed for customer:', customerId);

      const { error: updateError } = await supabase
        .from('memberships')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);

      if (updateError) {
        console.error('[Webhook] Failed to update membership:', updateError);
        return NextResponse.json({ received: true });
      }

      console.log('[Webhook] ✓ Membership updated to past_due');

      return NextResponse.json({ received: true });
    } catch (error: any) {
      console.error('[Webhook] Error processing payment failure:', error.message);
      console.error('[Webhook] Stack trace:', error.stack);
      return NextResponse.json({ received: true });
    }
  }

  // ============================================================================
  // invoice.finalized
  // Handle uncollectible invoices
  // ============================================================================
  if (event.type === 'invoice.finalized') {
    const invoice = event.data.object as any;
    console.log('[Webhook] Processing invoice.finalized');
    console.log('[Webhook] Invoice ID:', invoice.id);
    console.log('[Webhook] Status:', invoice.status);

    if (invoice.status !== 'uncollectible') {
      console.log('[Webhook] Invoice not uncollectible, skipping');
      return NextResponse.json({ received: true });
    }

    const customerId = invoice.customer;

    if (!customerId) {
      console.log('[Webhook] No customer ID in invoice');
      return NextResponse.json({ received: true });
    }

    try {
      console.log('[Webhook] Invoice uncollectible for customer:', customerId);

      const { error: updateError } = await supabase
        .from('memberships')
        .update({
          status: 'canceled',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);

      if (updateError) {
        console.error('[Webhook] Failed to update membership:', updateError);
        return NextResponse.json({ received: true });
      }

      console.log('[Webhook] ✓ Membership canceled due to uncollectible invoice');

      return NextResponse.json({ received: true });
    } catch (error: any) {
      console.error('[Webhook] Error processing uncollectible invoice:', error.message);
      console.error('[Webhook] Stack trace:', error.stack);
      return NextResponse.json({ received: true });
    }
  }

  // All other events are logged but not processed
  console.log('[Webhook] Event type not handled:', event.type);
  return NextResponse.json({ received: true });
}
