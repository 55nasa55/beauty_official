import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'updates array is required' }, { status: 400 });
    }

    const supabase = createSupabaseServiceRoleClient();

    for (const update of updates) {
      const { error } = await supabase
        .from('product_info_sections')
        .update({ order_index: update.order_index })
        .eq('id', update.id);

      if (error) {
        console.error('[Reorder Sections] Database error:', error);
        return NextResponse.json({ error: 'Failed to reorder sections' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Reorder Sections] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
