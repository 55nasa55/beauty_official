import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { product_id } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    const supabase = createSupabaseServiceRoleClient();

    // Archive the product
    const { data: product, error } = await supabase
      .from('products')
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq('id', product_id)
      .select()
      .single();

    if (error) {
      console.error('[Archive Product] Database error:', error);
      return NextResponse.json({ error: 'Failed to archive product' }, { status: 500 });
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('[Archive Product] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
