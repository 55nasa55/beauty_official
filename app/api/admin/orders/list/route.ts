import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const denied = await requireAdmin(request, supabase);
  if (denied) return denied;

  const supabaseAdmin = createSupabaseServiceRoleClient();

  try {
    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10));
    const pageSize = Math.max(10, Math.min(100, parseInt(searchParams.get('pageSize') || '25', 10)));
    const payment_status = searchParams.get('payment_status') || '';
    const shipping_status = searchParams.get('shipping_status') || '';
    const q = searchParams.get('q') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    let query = (supabaseAdmin as any)
      .from('orders')
      .select('id, order_number, created_at, payment_status, shipping_status, tracking_number, total_amount, tax_amount, currency, customer_email, customer_name', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }

    if (shipping_status) {
      query = query.eq('shipping_status', shipping_status);
    }

    if (q) {
      const searchPattern = `%${q}%`;
      query = query.or(`order_number.ilike.${searchPattern},customer_email.ilike.${searchPattern},customer_name.ilike.${searchPattern}`);
    }

    if (from) {
      query = query.gte('created_at', from);
    }

    if (to) {
      query = query.lte('created_at', to);
    }

    const rangeFrom = page * pageSize;
    const rangeTo = rangeFrom + pageSize - 1;
    query = query.range(rangeFrom, rangeTo);

    const { data, error, count } = await query;

    if (error) {
      console.error('[Orders List] Database error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orders: data || [],
      page,
      pageSize,
      total: count || 0,
    });
  } catch (error: any) {
    console.error('[Orders List] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
