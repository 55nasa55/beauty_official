import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categorySlug = searchParams.get('categorySlug');
  const selectedOptionIdsParam = searchParams.get('selectedOptionIds');

  if (!categorySlug) {
    return NextResponse.json(
      { error: 'categorySlug is required' },
      { status: 400 }
    );
  }

  const selectedOptionIds = selectedOptionIdsParam
    ? selectedOptionIdsParam.split(',').filter(id => id.trim())
    : [];

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

    const { data: facetsData, error: facetsError } = await supabase
      .from('category_facets')
      .select('id, name, slug, sort_order')
      .eq('category_id', category.id)
      .order('sort_order');

    if (facetsError) throw facetsError;

    if (!facetsData || facetsData.length === 0) {
      return NextResponse.json({ facets: [] });
    }

    const facetIds = facetsData.map(f => f.id);

    const { data: optionsData, error: optionsError } = await supabase
      .from('facet_options')
      .select('id, facet_id, label, value, sort_order')
      .in('facet_id', facetIds)
      .order('sort_order');

    if (optionsError) throw optionsError;

    const { data: allCategoryProducts, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', category.id);

    if (productsError) throw productsError;

    const allProductIds = (allCategoryProducts || []).map(p => p.id);

    if (allProductIds.length === 0) {
      const facets = facetsData.map(facet => ({
        id: facet.id,
        name: facet.name,
        slug: facet.slug,
        options: (optionsData || [])
          .filter(option => option.facet_id === facet.id)
          .map(option => ({
            id: option.id,
            label: option.label,
            value: option.value,
            count: 0,
          })),
      }));
      return NextResponse.json({ facets });
    }

    const selectedOptionsByFacet: Record<string, string[]> = {};
    if (selectedOptionIds.length > 0) {
      const { data: selectedOptionsData } = await supabase
        .from('facet_options')
        .select('id, facet_id')
        .in('id', selectedOptionIds);

      (selectedOptionsData || []).forEach(opt => {
        if (!selectedOptionsByFacet[opt.facet_id]) {
          selectedOptionsByFacet[opt.facet_id] = [];
        }
        selectedOptionsByFacet[opt.facet_id].push(opt.id);
      });
    }

    const countsMap: Record<string, number> = {};

    for (const facet of facetsData) {
      const otherFacetConstraints: Record<string, string[]> = {};
      for (const [facetId, optionIds] of Object.entries(selectedOptionsByFacet)) {
        if (facetId !== facet.id) {
          otherFacetConstraints[facetId] = optionIds;
        }
      }

      let baseProductIds = [...allProductIds];

      if (Object.keys(otherFacetConstraints).length > 0) {
        for (const [_, optionIds] of Object.entries(otherFacetConstraints)) {
          const { data: matchingProducts } = await supabase
            .from('product_facet_options')
            .select('product_id')
            .in('facet_option_id', optionIds);

          const matchingProductIds = new Set(
            (matchingProducts || []).map(p => p.product_id)
          );
          baseProductIds = baseProductIds.filter(id => matchingProductIds.has(id));
        }
      }

      if (baseProductIds.length === 0) {
        const facetOptions = (optionsData || []).filter(
          option => option.facet_id === facet.id
        );
        facetOptions.forEach(option => {
          countsMap[option.id] = 0;
        });
        continue;
      }

      const facetOptions = (optionsData || []).filter(
        option => option.facet_id === facet.id
      );
      const facetOptionIds = facetOptions.map(o => o.id);

      const { data: productFacetData } = await supabase
        .from('product_facet_options')
        .select('product_id, facet_option_id')
        .in('product_id', baseProductIds)
        .in('facet_option_id', facetOptionIds);

      facetOptions.forEach(option => {
        const count = (productFacetData || []).filter(
          pf => pf.facet_option_id === option.id
        ).length;
        countsMap[option.id] = count;
      });
    }

    const facets = facetsData.map(facet => ({
      id: facet.id,
      name: facet.name,
      slug: facet.slug,
      options: (optionsData || [])
        .filter(option => option.facet_id === facet.id)
        .map(option => ({
          id: option.id,
          label: option.label,
          value: option.value,
          count: countsMap[option.id] || 0,
        })),
    }));

    return NextResponse.json({ facets });
  } catch (error: any) {
    console.error('Error fetching facets:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
