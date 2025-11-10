import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { payment_intent, order_id } = await req.json();

    if (!payment_intent || !order_id) {
      return NextResponse.json(
        { error: 'Missing payment_intent or order_id' },
        { status: 400 }
      );
    }

    const refund = await stripe.refunds.create({
      payment_intent: payment_intent,
    });

    if (refund.status === 'succeeded') {
      const supabase = createServerClient();

      const { error: updateError } = await (supabase as any)
        .from('orders')
        .update({
          status: 'refunded',
          refund_date: new Date().toISOString(),
        })
        .eq('id', order_id);

      if (updateError) {
        console.error('Error updating order status:', updateError);
        return NextResponse.json(
          { error: 'Refund processed but failed to update order status' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        refund: refund,
      });
    } else {
      return NextResponse.json(
        { error: 'Refund failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process refund' },
      { status: 500 }
    );
  }
}
