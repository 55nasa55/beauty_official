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
  // Handles payment mode (orders only - NOT subscriptions)
  // ============================================================================
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('[Webhook] Processing checkout.session.completed');
    console.log('[Webhook] Session ID:', session.id);
    console.log('[Webhook] Mode:', session.mode);

    // Subscriptions are handled by customer.subscription.created
    if (session.mode === 'subscription') {
      console.log('[Webhook] Subscription checkout - will be handled by subscription.created event');
      console.log('[Webhook] Skipping membership creation from checkout session');
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
  // ONLY handler for creating new memberships
  // ============================================================================
  if (event.type === 'customer.subscription.created') {
    const subscriptionEvent = event.data.object as Stripe.Subscription;
    console.log('[Webhook] ========== SUBSCRIPTION CREATED ==========');
    console.log('[Webhook] Subscription ID:', subscriptionEvent.id);

    try {
      // Step 1: Fetch full subscription from Stripe
      console.log('[Webhook] Step 1: Fetching full subscription from Stripe');
      const subscription = await stripe.subscriptions.retrieve(subscriptionEvent.id, {
        expand: ['latest_invoice'],
      }) as any;
      console.log('[Webhook] ✓ Subscription retrieved');
      console.log('[Webhook] Subscription Status:', subscription.status);
      console.log('[Webhook] Customer ID:', subscription.customer);

      // Step 2: Extract price ID
      console.log('[Webhook] Step 2: Extracting price ID');
      const priceId = subscription.items.data[0]?.price.id;

      if (!priceId) {
        console.error('[Webhook] ❌ ERROR: No price ID found in subscription');
        console.error('[Webhook] Cannot create membership without price ID');
        return NextResponse.json({ received: true });
      }
      console.log('[Webhook] ✓ Price ID:', priceId);

      // Step 3: Look up membership plan
      console.log('[Webhook] Step 3: Looking up membership plan');
      const { data: plan } = await supabase
        .from('membership_plans')
        .select('id')
        .eq('stripe_price_id', priceId)
        .maybeSingle();

      if (!plan) {
        console.error('[Webhook] ❌ ERROR: No matching membership plan for price:', priceId);
        console.error('[Webhook] Cannot create membership without valid plan');
        return NextResponse.json({ received: true });
      }
      console.log('[Webhook] ✓ Plan ID:', plan.id);

      // Step 4: Resolve user_id
      console.log('[Webhook] Step 4: Resolving user_id');
      let userId = subscription.metadata?.user_id;
      console.log('[Webhook] Checking subscription metadata:', userId ? `Found: ${userId}` : 'Not found');

      if (!userId) {
        console.log('[Webhook] Attempting customer metadata lookup');
        try {
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          if ('metadata' in customer) {
            userId = customer.metadata?.user_id;
            console.log('[Webhook] Customer metadata:', userId ? `Found: ${userId}` : 'Not found');
          }
        } catch (error: any) {
          console.log('[Webhook] Failed to retrieve customer:', error.message);
        }
      }

      if (!userId) {
        console.log('[Webhook] Attempting existing membership lookup');
        const { data: existingMembership } = await supabase
          .from('memberships')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .maybeSingle();

        if (existingMembership) {
          userId = existingMembership.user_id;
          console.log('[Webhook] Existing membership:', `Found: ${userId}`);
        }
      }

      if (!userId) {
        console.error('[Webhook] ❌ ERROR: No user_id found - cannot create membership');
        console.error('[Webhook] Tried: subscription metadata, customer metadata, existing membership lookup');
        return NextResponse.json({ received: true });
      }
      console.log('[Webhook] ✓ User ID resolved:', userId);

      // Step 5: Resolve current_period_end with proper fallbacks
      console.log('[Webhook] Step 5: Resolving current_period_end');
      let currentPeriodEnd = subscription.current_period_end;

      if (!currentPeriodEnd) {
        console.log('[Webhook] current_period_end not found on subscription, checking latest_invoice.period_end');

        const latestInvoice = subscription.latest_invoice;
        if (latestInvoice && typeof latestInvoice === 'object') {
          if (latestInvoice.period_end) {
            currentPeriodEnd = latestInvoice.period_end;
            console.log('[Webhook] Found period_end in latest_invoice:', currentPeriodEnd);
          } else {
            console.log('[Webhook] latest_invoice.period_end not available, fetching invoice');
            try {
              const invoice = await stripe.invoices.retrieve(latestInvoice.id);
              if (invoice.period_end) {
                currentPeriodEnd = invoice.period_end;
                console.log('[Webhook] Found period_end in fetched invoice:', currentPeriodEnd);
              }
            } catch (error: any) {
              console.log('[Webhook] Failed to fetch invoice:', error.message);
            }
          }
        }
      }

      if (!currentPeriodEnd) {
        console.error('[Webhook] ❌ ERROR: Missing current_period_end after all fallback attempts');
        console.error('[Webhook] Cannot create membership without billing period');
        console.error('[Webhook] Subscription data:', JSON.stringify({
          id: subscription.id,
          current_period_end: subscription.current_period_end,
          latest_invoice: subscription.latest_invoice,
        }, null, 2));
        return NextResponse.json({ received: true });
      }

      const currentPeriodEndISO = new Date(currentPeriodEnd * 1000).toISOString();
      console.log('[Webhook] ✓ Current Period End:', currentPeriodEndISO);

      // Step 6: Determine membership status
      console.log('[Webhook] Step 6: Determining membership status');
      let membershipStatus = 'active';

      if (subscription.status === 'trialing' || subscription.status === 'active') {
        membershipStatus = 'active';
      } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        membershipStatus = 'past_due';
      } else if (['canceled', 'incomplete_expired'].includes(subscription.status)) {
        if (subscription.cancel_at_period_end) {
          membershipStatus = 'active';
          console.log('[Webhook] Subscription canceled but cancel_at_period_end=true, keeping active');
        } else {
          membershipStatus = 'canceled';
        }
      }
      console.log('[Webhook] ✓ Membership Status:', membershipStatus);

      // Step 7: Prepare membership data
      console.log('[Webhook] Step 7: Preparing membership data');
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
      console.log('[Webhook] Membership data:', JSON.stringify(membershipData, null, 2));

      // Step 8: Upsert membership by user_id
      console.log('[Webhook] Step 8: Upserting membership (by user_id)');
      const { error: upsertError } = await supabase
        .from('memberships')
        .upsert(membershipData, {
          onConflict: 'user_id',
        });

      if (upsertError) {
        console.error('[Webhook] ❌ ERROR: Failed to upsert membership:', upsertError);
        console.error('[Webhook] Error details:', JSON.stringify(upsertError, null, 2));
        return NextResponse.json({ received: true });
      }

      console.log('[Webhook] ========== ✓ MEMBERSHIP CREATED ==========');
      console.log('[Webhook]   User ID:', userId);
      console.log('[Webhook]   Plan ID:', plan.id);
      console.log('[Webhook]   Status:', membershipStatus);
      console.log('[Webhook]   Period End:', currentPeriodEndISO);
      console.log('[Webhook]   Cancel at Period End:', subscription.cancel_at_period_end || false);
      console.log('[Webhook] ================================================');

      return NextResponse.json({ received: true });
    } catch (error: any) {
      console.error('[Webhook] ❌ FATAL ERROR processing subscription.created:', error.message);
      console.error('[Webhook] Stack trace:', error.stack);
      return NextResponse.json({ received: true });
    }
  }

  // ============================================================================
  // customer.subscription.updated
  // ONLY handler for updating existing memberships
  // ============================================================================
  if (event.type === 'customer.subscription.updated') {
    const subscriptionEvent = event.data.object as Stripe.Subscription;
    console.log('[Webhook] ========== SUBSCRIPTION UPDATED ==========');
    console.log('[Webhook] Subscription ID:', subscriptionEvent.id);

    try {
      // Step 1: Fetch full subscription from Stripe
      console.log('[Webhook] Step 1: Fetching full subscription from Stripe');
      const subscription = await stripe.subscriptions.retrieve(subscriptionEvent.id, {
        expand: ['latest_invoice'],
      }) as any;
      console.log('[Webhook] ✓ Subscription retrieved');
      console.log('[Webhook] Subscription Status:', subscription.status);
      console.log('[Webhook] Customer ID:', subscription.customer);

      // Step 2: Resolve current_period_end with proper fallbacks
      console.log('[Webhook] Step 2: Resolving current_period_end');
      let currentPeriodEnd = subscription.current_period_end;

      if (!currentPeriodEnd) {
        console.log('[Webhook] current_period_end not found on subscription, checking latest_invoice.period_end');

        const latestInvoice = subscription.latest_invoice;
        if (latestInvoice && typeof latestInvoice === 'object') {
          if (latestInvoice.period_end) {
            currentPeriodEnd = latestInvoice.period_end;
            console.log('[Webhook] Found period_end in latest_invoice:', currentPeriodEnd);
          } else {
            console.log('[Webhook] latest_invoice.period_end not available, fetching invoice');
            try {
              const invoice = await stripe.invoices.retrieve(latestInvoice.id);
              if (invoice.period_end) {
                currentPeriodEnd = invoice.period_end;
                console.log('[Webhook] Found period_end in fetched invoice:', currentPeriodEnd);
              }
            } catch (error: any) {
              console.log('[Webhook] Failed to fetch invoice:', error.message);
            }
          }
        }
      }

      if (!currentPeriodEnd) {
        console.error('[Webhook] ❌ ERROR: Missing current_period_end after all fallback attempts');
        console.error('[Webhook] Cannot update membership without billing period');
        console.error('[Webhook] Subscription data:', JSON.stringify({
          id: subscription.id,
          current_period_end: subscription.current_period_end,
          latest_invoice: subscription.latest_invoice,
        }, null, 2));
        return NextResponse.json({ received: true });
      }

      const currentPeriodEndISO = new Date(currentPeriodEnd * 1000).toISOString();
      console.log('[Webhook] ✓ Current Period End:', currentPeriodEndISO);

      // Step 3: Determine membership status
      console.log('[Webhook] Step 3: Determining membership status');
      let membershipStatus = 'active';
      let endedAt = null;

      if (subscription.status === 'trialing' || subscription.status === 'active') {
        membershipStatus = 'active';
      } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        membershipStatus = 'past_due';
      } else if (['canceled', 'incomplete_expired'].includes(subscription.status)) {
        if (subscription.cancel_at_period_end) {
          membershipStatus = 'active';
          console.log('[Webhook] Subscription canceled but cancel_at_period_end=true, keeping active until period end');
        } else {
          membershipStatus = 'canceled';
          endedAt = new Date().toISOString();
          console.log('[Webhook] Subscription canceled immediately, setting ended_at');
        }
      }
      console.log('[Webhook] ✓ Membership Status:', membershipStatus);

      // Step 4: Prepare update data
      console.log('[Webhook] Step 4: Preparing update data');
      const updateData: any = {
        status: membershipStatus,
        current_period_end: currentPeriodEndISO,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        updated_at: new Date().toISOString(),
      };

      if (endedAt) {
        updateData.ended_at = endedAt;
      }
      console.log('[Webhook] Update data:', JSON.stringify(updateData, null, 2));

      // Step 5: Update membership by stripe_subscription_id
      console.log('[Webhook] Step 5: Updating membership (by stripe_subscription_id)');
      const { error: updateError } = await supabase
        .from('memberships')
        .update(updateData)
        .eq('stripe_subscription_id', subscription.id);

      if (updateError) {
        console.error('[Webhook] ❌ ERROR: Failed to update membership:', updateError);
        console.error('[Webhook] Error details:', JSON.stringify(updateError, null, 2));
        return NextResponse.json({ received: true });
      }

      console.log('[Webhook] ========== ✓ MEMBERSHIP UPDATED ==========');
      console.log('[Webhook]   Status:', membershipStatus);
      console.log('[Webhook]   Period End:', currentPeriodEndISO);
      console.log('[Webhook]   Cancel at Period End:', subscription.cancel_at_period_end || false);
      if (endedAt) {
        console.log('[Webhook]   Ended At:', endedAt);
      }
      console.log('[Webhook] ================================================');

      return NextResponse.json({ received: true });
    } catch (error: any) {
      console.error('[Webhook] ❌ FATAL ERROR processing subscription.updated:', error.message);
      console.error('[Webhook] Stack trace:', error.stack);
      return NextResponse.json({ received: true });
    }
  }

  // All other events are logged but not processed
  console.log('[Webhook] Event type not handled:', event.type);
  return NextResponse.json({ received: true });
}
