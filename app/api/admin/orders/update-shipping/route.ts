import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin/requireAdmin';

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { orderId, tracking_number, shipping_status } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {};

    if (tracking_number !== undefined) {
      updates.tracking_number = tracking_number?.trim() || null;
    }

    if (shipping_status) {
      updates.shipping_status = shipping_status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await (supabase as any)
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) {
      console.error('[Update Shipping] Database error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ order: data });
  } catch (error: any) {
    console.error('[Update Shipping] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update shipping' },
      { status: 500 }
    );
  }
}
