import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { product_id, image_url } = body;

    if (!product_id || !image_url) {
      return NextResponse.json(
        { error: 'product_id and image_url are required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceRoleClient();

    const { data: maxOrderResult } = await supabase
      .from('product_info_images')
      .select('order_index')
      .eq('product_id', product_id)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrderIndex = maxOrderResult ? maxOrderResult.order_index + 1 : 0;

    const { data, error } = await supabase
      .from('product_info_images')
      .insert({
        product_id,
        image_url,
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error('[Upload Image] Database error:', error);
      return NextResponse.json({ error: 'Failed to save image' }, { status: 500 });
    }

    return NextResponse.json({ image: data });
  } catch (error: any) {
    console.error('[Upload Image] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
