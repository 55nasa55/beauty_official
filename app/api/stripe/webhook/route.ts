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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('[Webhook] Processing checkout.session.completed');
    console.log('[Webhook] Session ID:', session.id);
    console.log('[Webhook] Mode:', session.mode);

    if (session.mode === 'subscription') {
      console.log('[Webhook] Subscription checkout - retrieving subscription details');

      try {
        const subscriptionId = session.subscription as string;
        const userId = session.client_reference_id || session.metadata?.user_id;

        if (!userId) {
          console.error('[Webhook] No user_id found in session');
          return NextResponse.json({ received: true });
        }

        if (!subscriptionId) {
          console.error('[Webhook] No subscription ID in session');
          return NextResponse.json({ received: true });
        }

        const retrievedSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        const subscriptionData = retrievedSubscription as any;

        console.log('[Webhook] Retrieved subscription details:');
        console.log('[Webhook]   - Subscription ID:', subscriptionData.id);
        console.log('[Webhook]   - Status:', subscriptionData.status);
        console.log('[Webhook]   - Current Period End (Unix):', subscriptionData.current_period_end);

        const priceId = subscriptionData.items.data[0]?.price.id;

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
          console.log('[Webhook] No matching membership plan found for price:', priceId);
          return NextResponse.json({ received: true });
        }

        if (!subscriptionData.current_period_end) {
          console.error('[Webhook] ERROR: Subscription missing current_period_end');
          console.error('[Webhook] This should not happen - Stripe subscriptions always have this field');
          return NextResponse.json({ received: true });
        }

        const currentPeriodEnd = subscriptionData.current_period_end;
        const currentPeriodEndISO = new Date(currentPeriodEnd * 1000).toISOString();
        const cancelAtPeriodEnd = subscriptionData.cancel_at_period_end || false;

        console.log('[Webhook]   - Current Period End (ISO):', currentPeriodEndISO);
        console.log('[Webhook]   - Cancel at Period End:', cancelAtPeriodEnd);

        let membershipStatus = 'inactive';

        if (subscriptionData.status === 'active' || subscriptionData.status === 'trialing') {
          membershipStatus = 'active';
        } else if (subscriptionData.status === 'canceled' && cancelAtPeriodEnd) {
          const periodEndDate = new Date(currentPeriodEndISO);
          const now = new Date();
          if (periodEndDate > now) {
            membershipStatus = 'active';
            console.log('[Webhook] Subscription canceled but keeping active until period end:', currentPeriodEndISO);
          }
        }

        const membershipData = {
          user_id: userId,
          plan_id: plan.id,
          status: membershipStatus,
          stripe_customer_id: subscriptionData.customer as string,
          stripe_subscription_id: subscriptionData.id,
          current_period_end: currentPeriodEndISO,
          cancel_at_period_end: cancelAtPeriodEnd,
          updated_at: new Date().toISOString(),
        };

        const { error: upsertError } = await supabase
          .from('memberships')
          .upsert(membershipData, {
            onConflict: 'user_id',
          });

        if (upsertError) {
          console.error('[Webhook] Failed to upsert membership:', upsertError);
          throw new Error(`Failed to upsert membership: ${upsertError.message}`);
        }

        console.log('[Webhook] ✓ Membership created/updated successfully');
        console.log('[Webhook]   - User ID:', userId);
        console.log('[Webhook]   - Stripe Status:', subscriptionData.status);
        console.log('[Webhook]   - Membership Status:', membershipStatus);
        console.log('[Webhook]   - Cancel at Period End:', cancelAtPeriodEnd);
        console.log('[Webhook]   - Period End:', membershipData.current_period_end || 'N/A');

        return NextResponse.json({ received: true });
      } catch (error: any) {
        console.error('[Webhook] Error processing subscription checkout:', error.message);
        console.error('[Webhook] Stack trace:', error.stack);
        return NextResponse.json({ received: true });
      }
    }

    console.log('[Webhook] Payment status:', session.payment_status);

  try {
    console.log('[Webhook] Step 1: Check for duplicate order');
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('order_number', session.id)
      .maybeSingle();

    if (checkError) {
      console.error('[Webhook] ❌ Error checking for existing order:', checkError);
      throw new Error(`Failed to check existing order: ${checkError.message}`);
    }

    if (existingOrder) {
      console.log('[Webhook] ⚠️  Order already exists with order_number:', session.id);
      console.log('[Webhook] Order ID:', existingOrder.id);
      console.log('[Webhook] Skipping creation to prevent duplicate');
      return NextResponse.json({ received: true, orderId: existingOrder.id });
    }

    console.log('[Webhook] ✓ No existing order found, proceeding with creation');

    console.log('[Webhook] Step 2: Retrieve full session with line items');
    let fullSession: any;
    try {
      fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items.data.price.product'],
      });
      console.log('[Webhook] ✓ Full session retrieved');
      console.log('[Webhook] Line items count:', fullSession.line_items?.data.length || 0);
    } catch (stripeError: any) {
      console.error('[Webhook] ❌ Failed to retrieve session from Stripe:', stripeError.message);
      throw new Error(`Failed to retrieve session: ${stripeError.message}`);
    }

    const lineItems = fullSession.line_items?.data || [];

    if (lineItems.length === 0) {
      console.error('[Webhook] ❌ No line items found in session');
      throw new Error('No line items found in checkout session');
    }

    console.log('[Webhook] Step 3: Extract customer and address information');
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

    console.log('[Webhook] Customer email:', customerEmail);
    console.log('[Webhook] Customer name:', customerName);
    console.log('[Webhook] Shipping address:', shippingAddress ? 'Present' : 'None');
    console.log('[Webhook] Billing address:', billingAddress ? 'Present' : 'None');

    console.log('[Webhook] Step 4: Calculate amounts');
    const totalAmount = (fullSession.amount_total || 0) / 100;
    const taxAmount = (fullSession.total_details?.amount_tax || 0) / 100;
    const currency = fullSession.currency || 'usd';

    console.log('[Webhook] Total amount:', totalAmount, currency.toUpperCase());
    console.log('[Webhook] Tax amount:', taxAmount, currency.toUpperCase());

    console.log('[Webhook] Step 5: Prepare order data');
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

    console.log('[Webhook] Order data prepared:');
    console.log('[Webhook]   - order_number:', orderData.order_number);
    console.log('[Webhook]   - user_id:', orderData.user_id || 'null (guest checkout)');
    console.log('[Webhook]   - payment_status:', orderData.payment_status);
    console.log('[Webhook]   - shipping_status:', orderData.shipping_status);
    console.log('[Webhook]   - total_amount:', orderData.total_amount);

    console.log('[Webhook] Step 6: Insert order into database');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select('id')
      .single();

    if (orderError) {
      console.error('[Webhook] ❌ FAILED to insert order into database');
      console.error('[Webhook] Error code:', orderError.code);
      console.error('[Webhook] Error message:', orderError.message);
      console.error('[Webhook] Error details:', orderError.details);
      console.error('[Webhook] Error hint:', orderError.hint);
      throw new Error(`Failed to insert order: ${orderError.message}`);
    }

    if (!order) {
      console.error('[Webhook] ❌ Order insert succeeded but no order returned');
      throw new Error('Order insert succeeded but no order data returned');
    }

    console.log('[Webhook] ✓ Order created successfully');
    console.log('[Webhook] Order ID:', order.id);

    console.log('[Webhook] Step 7: Prepare order items');
    const orderItems = lineItems.map((item: any, index: number) => {
      const product = item.price?.product as Stripe.Product;
      const productId = product?.metadata?.product_id || null;
      const variantId = product?.metadata?.variant_id || null;
      const productName = product?.name || 'Unknown Product';
      const variantName = item.description || null;
      const quantity = item.quantity || 1;
      const itemTotal = (item.amount_total || 0) / 100;
      const unitPrice = quantity > 0 ? itemTotal / quantity : 0;

      console.log(`[Webhook] Item ${index + 1}:`, {
        product_name: productName,
        variant_name: variantName,
        quantity: quantity,
        unit_price: unitPrice,
        item_total: itemTotal,
        product_id: productId || 'null',
        variant_id: variantId || 'null',
      });

      return {
        order_id: order.id,
        product_id: productId,
        variant_id: variantId,
        product_name: productName,
        variant_name: variantName,
        quantity: quantity,
        price: unitPrice,
      };
    });

    console.log('[Webhook] Total order items to insert:', orderItems.length);

    if (orderItems.length === 0) {
      console.error('[Webhook] ❌ No order items to insert! This should not happen.');
      throw new Error('No order items prepared for insertion');
    }

    console.log('[Webhook] Order items to insert:', JSON.stringify(orderItems, null, 2));

    console.log('[Webhook] Step 8: Insert order items into database');
    const { data: insertedItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select('id');

    if (itemsError) {
      console.error('[Webhook] ❌ FAILED to insert order items');
      console.error('[Webhook] Error code:', itemsError.code);
      console.error('[Webhook] Error message:', itemsError.message);
      console.error('[Webhook] Error details:', itemsError.details);
      console.error('[Webhook] Error hint:', itemsError.hint);
      console.error('[Webhook] Order items that failed:', JSON.stringify(orderItems, null, 2));
      console.error('[Webhook] ⚠️  Order was created but items failed - orphaned order:', order.id);
      throw new Error(`Failed to insert order items: ${itemsError.message}`);
    }

    if (!insertedItems || insertedItems.length === 0) {
      console.error('[Webhook] ⚠️  Order items insert succeeded but no items returned');
      console.warn('[Webhook] This might indicate RLS policy issues');
    }

    console.log('[Webhook] ✓ Order items created successfully');
    console.log('[Webhook] Items inserted:', insertedItems?.length || 0);
    console.log('[Webhook] Inserted item IDs:', insertedItems?.map(i => i.id).join(', ') || 'none');

    console.log('[Webhook] ========== ORDER CREATION COMPLETE ==========');
    console.log('[Webhook] Summary:');
    console.log('[Webhook]   - Order ID:', order.id);
    console.log('[Webhook]   - Order Number:', orderData.order_number);
    console.log('[Webhook]   - Total Amount:', orderData.total_amount, orderData.currency.toUpperCase());
    console.log('[Webhook]   - Items Count:', orderItems.length);
    console.log('[Webhook]   - Customer:', customerName || customerEmail || 'Guest');
    console.log('[Webhook] =================================================');

    return NextResponse.json({
      received: true,
      orderId: order.id,
      orderNumber: orderData.order_number,
    });

  } catch (error: any) {
    console.error('[Webhook] ========== FATAL ERROR ==========');
    console.error('[Webhook] Error processing webhook:', error.message);
    console.error('[Webhook] Stack trace:', error.stack);
    console.error('[Webhook] Session ID:', session.id);
    console.error('[Webhook] =====================================');

    return NextResponse.json({ received: true });
  }
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as any;
    console.log('[Webhook] Processing subscription event:', event.type);
    console.log('[Webhook] Subscription ID:', subscription.id);
    console.log('[Webhook] Stripe Status:', subscription.status);
    console.log('[Webhook] Current Period End (Unix):', subscription.current_period_end);

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
        console.log('[Webhook] No matching membership plan found for price:', priceId);
        return NextResponse.json({ received: true });
      }

      let userId = subscription.metadata?.user_id;

      if (!userId) {
        console.log('[Webhook] No user_id in subscription metadata, checking customer metadata');
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if ('metadata' in customer) {
          userId = customer.metadata?.user_id;
        }
      }

      if (!userId) {
        console.log('[Webhook] No user_id found, attempting lookup by stripe_customer_id');
        const { data: existingMembership } = await supabase
          .from('memberships')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .maybeSingle();

        if (existingMembership) {
          userId = existingMembership.user_id;
          console.log('[Webhook] Found user_id via stripe_customer_id:', userId);
        }
      }

      if (!userId) {
        console.error('[Webhook] No user_id found - cannot update membership');
        return NextResponse.json({ received: true });
      }

      if (!subscription.current_period_end) {
        console.error('[Webhook] ERROR: Subscription missing current_period_end');
        console.error('[Webhook] This should not happen - Stripe subscriptions always have this field');
        return NextResponse.json({ received: true });
      }

      const currentPeriodEnd = subscription.current_period_end;
      const currentPeriodEndISO = new Date(currentPeriodEnd * 1000).toISOString();
      const cancelAtPeriodEnd = subscription.cancel_at_period_end || false;

      console.log('[Webhook] Current Period End (ISO):', currentPeriodEndISO);
      console.log('[Webhook] Cancel at Period End:', cancelAtPeriodEnd);

      let membershipStatus = 'inactive';

      if (subscription.status === 'active' || subscription.status === 'trialing') {
        membershipStatus = 'active';
      } else if (subscription.status === 'canceled' && cancelAtPeriodEnd) {
        const periodEndDate = new Date(currentPeriodEndISO);
        const now = new Date();
        if (periodEndDate > now) {
          membershipStatus = 'active';
          console.log('[Webhook] Subscription canceled but keeping active until period end:', currentPeriodEndISO);
        }
      }

      const membershipData = {
        user_id: userId,
        plan_id: plan.id,
        status: membershipStatus,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        current_period_end: currentPeriodEndISO,
        cancel_at_period_end: cancelAtPeriodEnd,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('memberships')
        .upsert(membershipData, {
          onConflict: 'user_id',
        });

      if (upsertError) {
        console.error('[Webhook] Failed to upsert membership:', upsertError);
        throw new Error(`Failed to upsert membership: ${upsertError.message}`);
      }

      console.log('[Webhook] ✓ Membership updated successfully');
      console.log('[Webhook]   - User ID:', userId);
      console.log('[Webhook]   - Stripe Status:', subscription.status);
      console.log('[Webhook]   - Membership Status:', membershipStatus);
      console.log('[Webhook]   - Cancel at Period End:', cancelAtPeriodEnd);
      console.log('[Webhook]   - Period End:', membershipData.current_period_end || 'N/A');

      return NextResponse.json({ received: true });
    } catch (error: any) {
      console.error('[Webhook] Error processing subscription:', error.message);
      console.error('[Webhook] Stack trace:', error.stack);
      return NextResponse.json({ received: true });
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as any;
    console.log('[Webhook] Processing invoice.payment_failed');
    console.log('[Webhook] Invoice ID:', invoice.id);

    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id;

    console.log('[Webhook] Subscription ID:', subscriptionId);

    try {
      if (!subscriptionId) {
        console.log('[Webhook] No subscription associated with invoice');
        return NextResponse.json({ received: true });
      }

      const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id;

      if (!customerId) {
        console.error('[Webhook] No customer ID found in invoice');
        return NextResponse.json({ received: true });
      }

      const { data: membership, error: lookupError } = await supabase
        .from('memberships')
        .select('id, user_id, status')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();

      if (lookupError || !membership) {
        console.error('[Webhook] Failed to find membership for customer:', customerId);
        return NextResponse.json({ received: true });
      }

      console.log('[Webhook] Found membership for user:', membership.user_id);
      console.log('[Webhook] Current status:', membership.status);

      const { error: updateError } = await supabase
        .from('memberships')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString(),
        })
        .eq('id', membership.id);

      if (updateError) {
        console.error('[Webhook] Failed to update membership status:', updateError);
        throw new Error(`Failed to update membership: ${updateError.message}`);
      }

      console.log('[Webhook] ✓ Membership marked as inactive due to payment failure');
      console.log('[Webhook]   - User ID:', membership.user_id);
      console.log('[Webhook]   - New Status: inactive');

      return NextResponse.json({ received: true });
    } catch (error: any) {
      console.error('[Webhook] Error processing payment failure:', error.message);
      console.error('[Webhook] Stack trace:', error.stack);
      return NextResponse.json({ received: true });
    }
  }

  console.log('[Webhook] Ignoring event type:', event.type);
  return NextResponse.json({ received: true });
}
