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
        .eq('category_id', category.id);

      if (countError) throw countError;

      total = count || 0;

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', category.id)
        .order('name')
        .range(offset, offset + limit - 1);

      if (productsError) throw productsError;

      productIds = (productsData || []).map(p => p.id);
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
      .select('id, name, slug, description, category_id, brand_id')
      .in('id', productIds);

    if (productsError) throw productsError;

    const brandIds = Array.from(new Set((productsData || []).map(p => p.brand_id).filter(Boolean)));
    const categoryIds = Array.from(new Set((productsData || []).map(p => p.category_id).filter(Boolean)));

    const [brandsResult, categoriesResult, variantsResult] = await Promise.all([
      brandIds.length > 0
        ? supabase.from('brands').select('id, name').in('id', brandIds)
        : Promise.resolve({ data: [] }),
      categoryIds.length > 0
        ? supabase.from('categories').select('id, name').in('id', categoryIds)
        : Promise.resolve({ data: [] }),
      supabase.from('product_variants').select('*').in('product_id', productIds),
    ]);

    const brandsMap: Record<string, string> = {};
    (brandsResult.data || []).forEach(brand => {
      brandsMap[brand.id] = brand.name;
    });

    const categoriesMap: Record<string, string> = {};
    (categoriesResult.data || []).forEach(cat => {
      categoriesMap[cat.id] = cat.name;
    });

    const variantsByProduct: Record<string, any[]> = {};
    (variantsResult.data || []).forEach(variant => {
      if (!variantsByProduct[variant.product_id]) {
        variantsByProduct[variant.product_id] = [];
      }
      variantsByProduct[variant.product_id].push(variant);
    });

    const products = (productsData || []).map(product => {
      const variants = variantsByProduct[product.id] || [];
      const lowestPriceVariant = variants.reduce((min, v) =>
        !min || v.price < min.price ? v : min, null
      );

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        brand: product.brand_id ? brandsMap[product.brand_id] || '' : '',
        category: product.category_id ? categoriesMap[product.category_id] || '' : '',
        image: lowestPriceVariant?.images?.[0] || '',
        price: lowestPriceVariant?.price || 0,
        compareAtPrice: lowestPriceVariant?.compare_at_price || null,
      };
    });

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
