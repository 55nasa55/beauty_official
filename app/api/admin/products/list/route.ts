import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10) || 0);
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10) || 10));
    const q = searchParams.get('q') || '';
    const brandId = searchParams.get('brand_id') || '';
    const categoryId = searchParams.get('category_id') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    const supabase = createSupabaseServerClient();

    let query = supabase
      .from('products')
      .select('id, created_at, name, slug, category_id, brand_id, tags, is_featured, is_best_seller, is_new', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (from) {
      query = query.gte('created_at', from);
    }

    if (to) {
      query = query.lte('created_at', to);
    }

    if (q.trim()) {
      query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
    }

    const fromIdx = page * pageSize;
    const toIdx = fromIdx + pageSize - 1;
    query = query.range(fromIdx, toIdx);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      products: data || [],
      page,
      pageSize,
      total: count || 0,
    });
  } catch (err: any) {
    console.error('Admin products list error:', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
