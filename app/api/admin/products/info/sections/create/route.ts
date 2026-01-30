import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { product_id, title, content } = body;

    if (!product_id || !title || !content) {
      return NextResponse.json(
        { error: 'product_id, title, and content are required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceRoleClient();

    const { data: maxOrderResult } = await supabase
      .from('product_info_sections')
      .select('order_index')
      .eq('product_id', product_id)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrderIndex = maxOrderResult ? maxOrderResult.order_index + 1 : 0;

    const { data, error } = await supabase
      .from('product_info_sections')
      .insert({
        product_id,
        title,
        content,
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error('[Create Section] Database error:', error);
      return NextResponse.json({ error: 'Failed to create section' }, { status: 500 });
    }

    return NextResponse.json({ section: data });
  } catch (error: any) {
    console.error('[Create Section] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
