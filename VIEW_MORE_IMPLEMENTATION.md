# View More Button Implementation

## Overview

All product carousels on the Good Looks website now include "View More" buttons that navigate to dynamic product listing pages filtered by tag or collection.

## Implementation Details

### 1. ProductCarousel Component Updates

**File**: `/components/ProductCarousel.tsx`

- Added `viewMoreSlug` optional prop
- Added centered "View More" button below carousel
- Button styling: clean, premium white theme with subtle hover effects
- Uses Next.js Link for client-side navigation

**Button Styles**:
- Rounded full border
- Light font weight with tracking
- Subtle hover transition (bg-gray-50, darker border)
- Consistent with site's clean aesthetic

### 2. Dynamic Products Page

**File**: `/app/products/[tag]/page.tsx`

**Features**:
- Dynamic routing based on tag/collection slug
- Fetches all products from Supabase
- Filters by normalized tag (converts hyphens to underscores for matching)
- Supports both tag-based and collection-based filtering
- Returns 404 if no products found
- Responsive grid layout (1-4 columns based on screen size)
- Uses ProductCard component for consistent product display

**Data Fetched**:
- Product name
- Product price
- Product description
- Product category
- Product images
- Product brand
- Product tags
- Product variants
- All other product fields from Supabase

### 3. Homepage Integration

**File**: `/app/page.tsx`

**Changes**:
- Tag carousels: Compute slug by converting underscores to hyphens
- Collection carousels: Use existing collection slug
- Pass `viewMoreSlug` prop to all ProductCarousel components

## URL Mapping

### Tag-Based Carousels

| Tag | Display Title | URL | Product Count |
|-----|---------------|-----|---------------|
| `best_seller` | Best Seller | `/products/best-seller` | 7 products |
| `featured` | Featured | `/products/featured` | 7 products |
| `new` | New | `/products/new` | 4 products |

### Collection-Based Carousels

| Collection | Display Title | URL | Product Count |
|------------|---------------|-----|---------------|
| `staff-favorites` | Staff Favorites | `/products/staff-favorites` | 5 products |

## Dynamic Routing

The implementation uses Next.js dynamic routing with the `[tag]` parameter. This means:

1. **Automatic page creation**: New tags added in Supabase automatically create new accessible pages
2. **No hard-coding required**: Tag/collection slugs are computed dynamically
3. **SEO-friendly URLs**: Clean, readable URLs like `/products/featured`

### Tag Normalization

The page handles tag normalization to ensure proper matching:
- URL slug: `best-seller` (hyphens)
- Database tag: `best_seller` (underscores)
- Conversion: Bidirectional normalization ensures matches

## User Experience

### From Homepage
1. User sees product carousel with title (e.g., "Featured")
2. User scrolls through products or clicks navigation arrows
3. User clicks "View More" button below carousel
4. User navigates to `/products/featured`

### On Products Page
1. Page displays title and description
2. Products shown in responsive grid (4 columns on desktop)
3. Each product card shows:
   - Product image (optimized with Next.js Image)
   - Product name
   - Product price
   - Link to product detail page
4. Clicking any product navigates to `/product/[slug]`

## Styling Consistency

All elements maintain the site's premium white theme:
- Clean typography with light font weights
- Subtle hover states
- Ample whitespace
- Responsive grid layouts
- Consistent spacing (gap-8, py-12, etc.)
- Professional, minimalist design

## Build Status

✅ **Build Successful**
- TypeScript compilation passed
- All routes generated correctly
- New dynamic route: `/products/[tag]`
- No type errors
- Component renders without errors

## Future Extensibility

The implementation is designed to scale:
- Add new tags in Supabase → Automatic new pages
- Add new collections → Automatic View More buttons
- No code changes needed for new product groupings
- Fully data-driven from Supabase

## Testing Checklist

- [x] View More buttons appear on all carousels
- [x] Buttons navigate to correct URLs
- [x] Tag-based pages filter correctly
- [x] Collection-based pages filter correctly
- [x] Product grid displays properly
- [x] Product cards link to detail pages
- [x] Responsive layout works on all screen sizes
- [x] 404 handling for invalid tags
- [x] Clean, premium styling throughout
- [x] Build passes without errors
