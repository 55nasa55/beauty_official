import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { id, title, content } = body;

    if (!id || !title || !content) {
      return NextResponse.json(
        { error: 'id, title, and content are required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceRoleClient();

    const { data, error } = await supabase
      .from('product_info_sections')
      .update({ title, content })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Update Section] Database error:', error);
      return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
    }

    return NextResponse.json({ section: data });
  } catch (error: any) {
    console.error('[Update Section] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
