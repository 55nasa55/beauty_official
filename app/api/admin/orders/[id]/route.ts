import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data: order, error: orderError } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('[Order Details] Order fetch error:', orderError);
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const { data: orderItems, error: itemsError } = await (supabase as any)
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('[Order Details] Items fetch error:', itemsError);
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    const items = orderItems || [];
    let enrichedItems = items;

    if (items.length > 0) {
      const variantIds = Array.from(new Set(items.map((item: any) => item.variant_id)));

      const { data: variants, error: variantsError } = await (supabase as any)
        .from('product_variants')
        .select('id, images, sku')
        .in('id', variantIds);

      if (variantsError) {
        console.error('[Order Details] Variants fetch error:', variantsError);
      } else {
        const variantMap = new Map(
          (variants || []).map((v: any) => [v.id, v])
        );

        enrichedItems = items.map((item: any) => ({
          ...item,
          variant: variantMap.get(item.variant_id) || null,
        }));
      }
    }

    const itemCount = items.length;

    return NextResponse.json({
      order,
      items: enrichedItems,
      itemCount,
    });
  } catch (error: any) {
    console.error('[Order Details] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
