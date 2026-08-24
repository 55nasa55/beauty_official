import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('status, stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    // If user has an active or past_due subscription, redirect to portal instead
    if (existingMembership && (existingMembership.status === 'active' || existingMembership.status === 'past_due')) {
      if (!existingMembership.stripe_customer_id) {
        return NextResponse.json(
          { error: 'Invalid membership state' },
          { status: 400 }
        );
      }

      const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      try {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: existingMembership.stripe_customer_id,
          return_url: `${origin}/account`,
        });

        return NextResponse.json({ url: portalSession.url });
      } catch (portalErr: any) {
        if (portalErr.type === 'StripeInvalidRequestError' && /no such customer/i.test(portalErr.message)) {
          console.warn(`Stale stripe_customer_id for user ${user.id} in active membership, falling through to new checkout.`);
        } else {
          throw portalErr;
        }
      }
    }

    let customerId = existingMembership?.stripe_customer_id;

    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch (err: any) {
        if (err.type === 'StripeInvalidRequestError' && /no such customer/i.test(err.message)) {
          console.warn(`Stale stripe_customer_id for user ${user.id}, creating new customer.`);
          customerId = null;
        } else {
          throw err;
        }
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;

      const { error: updateError } = await supabase
        .from('memberships')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to update stale stripe_customer_id:', updateError);
      }
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/account?membership=success`,
      cancel_url: `${origin}/pricing`,
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
      metadata: {
        user_id: user.id,
        source: 'membership',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating membership checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
