import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const veeqoApiKey = process.env.VEEQO_API_KEY;
    if (!veeqoApiKey) {
      return NextResponse.json({ error: 'Veeqo API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.veeqo.com/sellables', {
      method: 'GET',
      headers: {
        'x-api-key': veeqoApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Veeqo API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const sellables = await response.json();

    let synced = 0;
    let updated = 0;
    let skipped = 0;

    for (const sellable of sellables) {
      const skuCode = sellable.sku_code;
      const sellableId = sellable.id;
      const productId = sellable.product?.id;

      if (!skuCode || !sellableId) {
        skipped++;
        continue;
      }

      let product = null;

      const { data: productBySku } = await supabase
        .from('products')
        .select('id, veeqo_sellable_id, veeqo_product_id')
        .eq('sku', skuCode)
        .maybeSingle();

      if (productBySku) {
        product = productBySku;
      } else if (productId) {
        const { data: productByVeeqoId } = await supabase
          .from('products')
          .select('id, veeqo_sellable_id, veeqo_product_id')
          .eq('veeqo_product_id', productId)
          .maybeSingle();

        if (productByVeeqoId) {
          product = productByVeeqoId;
        }
      }

      if (!product) {
        skipped++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({
          veeqo_sellable_id: sellableId,
          veeqo_product_id: productId || product.veeqo_product_id,
        })
        .eq('id', product.id);

      if (updateError) {
        console.error(`Failed to update product ${product.id}:`, updateError);
        skipped++;
      } else {
        synced++;
        updated++;
      }
    }

    return NextResponse.json({
      synced,
      updated,
      skipped,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
