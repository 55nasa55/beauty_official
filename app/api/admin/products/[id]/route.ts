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
    const supabase = createSupabaseServerClient();
    const productId = params.id;

    const [productResult, variantsResult] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single(),
      supabase
        .from('product_variants')
        .select('id, sku, name, price, compare_at_price, stock, images, specs')
        .eq('product_id', productId)
        .order('created_at')
    ]);

    if (productResult.error) {
      console.error('Error fetching product:', productResult.error);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const variants = variantsResult.data || [];

    return NextResponse.json({
      product: productResult.data,
      variants,
      variantCount: variants.length,
    });
  } catch (error) {
    console.error('Error in product details endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
