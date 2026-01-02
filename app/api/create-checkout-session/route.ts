import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { cartItems } = await req.json();

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    const variantIds = cartItems.map((item: any) => item.variantId);

    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, name, price, images, product_id, products(name, slug)')
      .in('id', variantIds);

    if (variantsError || !variants) {
      return NextResponse.json(
        { error: 'Failed to fetch product details' },
        { status: 500 }
      );
    }

    const lineItems = cartItems.map((item: any) => {
      const variant = (variants as any[]).find((v: any) => v.id === item.variantId);
      if (!variant) {
        throw new Error(`Variant ${item.variantId} not found`);
      }

      const product = variant.products as any;
      const productName = product?.name || 'Product';

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${productName} - ${variant.name}`,
            images: variant.images && variant.images.length > 0
              ? [variant.images[0]]
              : [],
            metadata: {
              product_id: variant.product_id,
              variant_id: variant.id,
            },
          },
          unit_amount: Math.round(variant.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const sessionConfig: any = {
      mode: 'payment',
      line_items: lineItems,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      automatic_tax: {
        enabled: true,
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      billing_address_collection: 'required',
      metadata: {
        source: 'web',
      },
    };

    if (user) {
      sessionConfig.client_reference_id = user.id;
      sessionConfig.metadata.user_id = user.id;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
