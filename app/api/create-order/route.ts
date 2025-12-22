import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log('[Create Order] Fetching session from Stripe:', sessionId);

    // Fetch the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product'],
    });

    if (!session) {
      console.error('[Create Order] Session not found:', sessionId);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log('[Create Order] Session retrieved:', {
      id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
    });

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      console.log('[Create Order] Payment not completed:', session.payment_status);
      return NextResponse.json(
        { error: 'Payment not completed', status: session.payment_status },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Check if order already exists
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (existingOrder) {
      console.log('[Create Order] Order already exists:', (existingOrder as any).id);
      return NextResponse.json({
        success: true,
        orderId: (existingOrder as any).id,
        message: 'Order already exists',
      });
    }

    console.log('[Create Order] Creating new order...');

    // Fetch line items
    const lineItems = session.line_items?.data || [];

    const items = lineItems.map((item) => {
      const product = item.price?.product as any;
      return {
        product_name: product?.name || 'Unknown',
        variant_name: item.description || '',
        quantity: item.quantity || 1,
        price: (item.amount_total || 0) / 100,
        price_id: item.price?.id,
        product_id: product?.metadata?.product_id,
        variant_id: product?.metadata?.variant_id,
      };
    });

    const sessionWithDetails = session as any;

    const shippingAddress = sessionWithDetails.shipping_details?.address
      ? {
          line1: sessionWithDetails.shipping_details.address.line1,
          line2: sessionWithDetails.shipping_details.address.line2,
          city: sessionWithDetails.shipping_details.address.city,
          state: sessionWithDetails.shipping_details.address.state,
          postal_code: sessionWithDetails.shipping_details.address.postal_code,
          country: sessionWithDetails.shipping_details.address.country,
          name: sessionWithDetails.shipping_details.name,
        }
      : null;

    const billingAddress = sessionWithDetails.customer_details?.address
      ? {
          line1: sessionWithDetails.customer_details.address.line1,
          line2: sessionWithDetails.customer_details.address.line2,
          city: sessionWithDetails.customer_details.address.city,
          state: sessionWithDetails.customer_details.address.state,
          postal_code: sessionWithDetails.customer_details.address.postal_code,
          country: sessionWithDetails.customer_details.address.country,
        }
      : null;

    const taxAmount = (sessionWithDetails.total_details?.amount_tax || 0) / 100;
    const customerEmail = sessionWithDetails.customer_details?.email || null;
    const customerName = sessionWithDetails.customer_details?.name ||
                        sessionWithDetails.shipping_details?.name || null;

    const orderData = {
      user_id: session.metadata?.user_id || null,
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent as string,
      status: 'paid',
      total_amount: (session.amount_total || 0) / 100,
      tax_amount: taxAmount,
      currency: session.currency || 'usd',
      customer_email: customerEmail,
      customer_name: customerName,
      shipping_address: shippingAddress,
      billing_address: billingAddress,
      items: items,
      tax_details: sessionWithDetails.total_details?.breakdown || null,
    };

    console.log('[Create Order] Inserting order into Supabase...');

    const { data: order, error: insertError } = await (supabase as any)
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (insertError) {
      console.error('[Create Order] Error inserting order:', insertError);
      return NextResponse.json(
        { error: 'Failed to create order', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('[Create Order] Order created successfully:', order.id);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: 'Order created successfully',
    });
  } catch (error: any) {
    console.error('[Create Order] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
