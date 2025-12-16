import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query params with defaults and clamping
    const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10));
    const requestedPageSize = parseInt(searchParams.get('pageSize') || '60', 10);
    const pageSize = Math.min(Math.max(20, requestedPageSize), 200); // Clamp between 20-200
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortDir = searchParams.get('sortDir') || 'desc';

    // Build query
    let query = supabase
      .from('admin_images')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.ilike('path', `%${search}%`);
    }

    // Apply sorting
    const ascending = sortDir === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching images:', error);
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      );
    }

    // Add public URLs to each image
    const imagesWithUrls = (data || []).map((image) => {
      const { data: urlData } = supabase.storage
        .from(image.bucket)
        .getPublicUrl(image.path);

      return {
        ...image,
        url: urlData.publicUrl,
      };
    });

    return NextResponse.json({
      images: imagesWithUrls,
      page,
      pageSize,
      total: count || 0,
    });
  } catch (error: any) {
    console.error('Unexpected error in /api/admin/images/list:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
