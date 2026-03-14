import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categorySlug = searchParams.get('categorySlug');
  const offsetParam = searchParams.get('offset');
  const limitParam = searchParams.get('limit');
  const optionIdsParam = searchParams.get('optionIds');

  if (!categorySlug) {
    return NextResponse.json(
      { error: 'categorySlug is required' },
      { status: 400 }
    );
  }

  const offset = Math.max(0, parseInt(offsetParam || '0', 10));
  const limit = Math.min(48, Math.max(12, parseInt(limitParam || '24', 10)));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle();

    if (categoryError) throw categoryError;

    console.log("CATEGORY LOOKUP");
    console.log("categorySlug:", categorySlug);
    console.log("resolved category id:", category?.id);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    let productIds: string[] = [];
    let total = 0;

    if (!optionIdsParam || optionIdsParam.trim() === '') {
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .or('archived.is.null,archived.eq.false');

      if (countError) throw countError;

      total = count || 0;

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', category.id)
        .or('archived.is.null,archived.eq.false')
        .order('name')
        .range(offset, offset + limit - 1);

      if (productsError) throw productsError;

      productIds = (productsData || []).map(p => p.id);

      console.log("CATEGORY PRODUCT IDS");
      console.log("productIds:", productIds);
      console.log("total count:", total);
    } else {
      const optionIds = optionIdsParam.split(',').filter(id => id.trim());

      if (optionIds.length === 0) {
        return NextResponse.json({
          products: [],
          offset,
          limit,
          total: 0,
          hasMore: false,
        });
      }

      const { data: optionsData, error: optionsError } = await supabase
        .from('facet_options')
        .select('id, facet_id')
        .in('id', optionIds);

      if (optionsError) throw optionsError;

      const optionsByFacet: Record<string, string[]> = {};
      (optionsData || []).forEach(option => {
        if (!optionsByFacet[option.facet_id]) {
          optionsByFacet[option.facet_id] = [];
        }
        optionsByFacet[option.facet_id].push(option.id);
      });

      const facetGroups = Object.values(optionsByFacet);

      if (facetGroups.length === 0) {
        return NextResponse.json({
          products: [],
          offset,
          limit,
          total: 0,
          hasMore: false,
        });
      }

      const productIdSets: Set<string>[] = [];

      for (const optionIdsInFacet of facetGroups) {
        const { data: productFacetData, error: productFacetError } = await supabase
          .from('product_facet_options')
          .select('product_id')
          .in('facet_option_id', optionIdsInFacet);

        if (productFacetError) throw productFacetError;

        const productIdsSet = new Set(
          (productFacetData || []).map(pf => pf.product_id)
        );

        productIdSets.push(productIdsSet);
      }

      let intersectedProductIds = productIdSets[0];
      for (let i = 1; i < productIdSets.length; i++) {
        intersectedProductIds = new Set(
          Array.from(intersectedProductIds).filter(id => productIdSets[i].has(id))
        );
      }

      if (intersectedProductIds.size === 0) {
        return NextResponse.json({
          products: [],
          offset,
          limit,
          total: 0,
          hasMore: false,
        });
      }

      const allProductIds = Array.from(intersectedProductIds);

      const { data: categoryFilteredData, error: categoryFilterError } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', category.id)
        .or('archived.is.null,archived.eq.false')
        .in('id', allProductIds);

      if (categoryFilterError) throw categoryFilterError;

      const finalProductIds = (categoryFilteredData || []).map(p => p.id);

      total = finalProductIds.length;

      productIds = finalProductIds.slice(offset, offset + limit);
    }

    if (productIds.length === 0) {
      return NextResponse.json({
        products: [],
        offset,
        limit,
        total,
        hasMore: false,
      });
    }

    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        brand:brands(
          name,
          slug
        ),
        variants:product_variants!left(
          id,
          product_id,
          name,
          price,
          member_price_cents,
          compare_at_price,
          images,
          sku,
          specs,
          created_at,
          updated_at
        )
      `)
      .in('id', productIds)
      .or('archived.is.null,archived.eq.false');

    if (productsError) throw productsError;

    console.log("FINAL PRODUCT QUERY RESULT");
    console.log("productsData:", productsData);
    console.log("productIds used for hydration:", productIds);

    const products = (productsData || []).map(product => ({
      ...product,
      average_rating: null,
      review_count: null,
      brand: product.brand || { name: '', slug: '' },
      variants: product.variants || [],
    }));

    const hasMore = offset + productIds.length < total;

    return NextResponse.json({
      products,
      offset,
      limit,
      total,
      hasMore,
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
