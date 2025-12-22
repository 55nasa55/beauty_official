import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { payment_intent, order_id } = await req.json();

    if (!payment_intent || !order_id) {
      return NextResponse.json(
        { error: 'Missing payment_intent or order_id' },
        { status: 400 }
      );
    }

    console.log('[Refund] Processing refund for order:', order_id);

    const refund = await stripe.refunds.create({
      payment_intent: payment_intent,
    });

    console.log('[Refund] Stripe refund status:', refund.status);

    if (refund.status === 'succeeded') {
      const supabase = createSupabaseServerClient();

      const { data, error: updateError } = await (supabase as any)
        .from('orders')
        .update({
          payment_status: 'refunded',
        })
        .eq('id', order_id)
        .select('*')
        .single();

      if (updateError) {
        console.error('[Refund] Database error:', updateError);
        return NextResponse.json(
          { error: 'Refund processed but failed to update order status: ' + updateError.message },
          { status: 500 }
        );
      }

      console.log('[Refund] Order updated successfully:', data.id);

      return NextResponse.json({
        success: true,
        refund_id: refund.id,
        order: data,
      });
    } else {
      console.error('[Refund] Refund failed with status:', refund.status);
      return NextResponse.json(
        { error: `Refund failed with status: ${refund.status}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Refund] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process refund' },
      { status: 500 }
    );
  }
}
