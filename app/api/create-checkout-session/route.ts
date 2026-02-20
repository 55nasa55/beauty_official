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

    let isMember = false;
    if (user) {
      const { data: membership } = await supabase
        .from('memberships')
        .select('status, current_period_end')
        .eq('user_id', user.id)
        .maybeSingle();

      isMember = !!(
        membership &&
        membership.status === 'active' &&
        (!membership.current_period_end ||
          new Date(membership.current_period_end) > new Date())
      );
    }

    const variantIds = cartItems.map((item: any) => item.variantId);

    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, name, price, member_price_cents, images, product_id, stock_quantity, track_inventory, products(name, slug, member_price_cents, archived)')
      .in('id', variantIds);

    if (variantsError || !variants) {
      return NextResponse.json(
        { error: 'Failed to fetch product details' },
        { status: 500 }
      );
    }

    // Check if any products are archived
    const archivedProducts = variants.filter((v: any) => v.products?.archived);
    if (archivedProducts.length > 0) {
      return NextResponse.json(
        { error: 'One or more products in your cart are no longer available.' },
        { status: 400 }
      );
    }

    // Stock validation
    for (const item of cartItems) {
      const variant = (variants as any[]).find((v: any) => v.id === item.variantId);
      if (!variant) {
        return NextResponse.json(
          { error: `Product variant not found.` },
          { status: 400 }
        );
      }

      if (variant.track_inventory) {
        if (variant.stock_quantity === 0) {
          return NextResponse.json(
            { error: 'Some items are out of stock.' },
            { status: 400 }
          );
        }

        if (item.quantity > variant.stock_quantity) {
          const productName = variant.products?.name || 'Product';
          return NextResponse.json(
            { error: `Only ${variant.stock_quantity} left for ${productName} - ${variant.name}.` },
            { status: 400 }
          );
        }
      }
    }

    const lineItems = cartItems.map((item: any) => {
      const variant = (variants as any[]).find((v: any) => v.id === item.variantId);
      if (!variant) {
        throw new Error(`Variant ${item.variantId} not found`);
      }

      const product = variant.products as any;
      const productName = product?.name || 'Product';

      let priceToUse = variant.price;
      if (isMember) {
        if (variant.member_price_cents) {
          priceToUse = variant.member_price_cents / 100;
        } else if (product?.member_price_cents) {
          priceToUse = product.member_price_cents / 100;
        }
      }

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
          unit_amount: Math.round(priceToUse * 100),
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
