import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categorySlug = searchParams.get('categorySlug');

  if (!categorySlug) {
    return NextResponse.json(
      { error: 'categorySlug is required' },
      { status: 400 }
    );
  }

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
