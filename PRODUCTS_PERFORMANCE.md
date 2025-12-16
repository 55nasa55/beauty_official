# Products Admin Performance Optimizations

## Overview

The Admin Products page has been refactored to handle thousands of products efficiently through:
- Server-side pagination (25 products per page by default)
- Server-side filtering and search
- Lazy-loading of product variants and images
- Debounced search input (300ms delay)

## Architecture

### Endpoints

**List Endpoint** (`/api/admin/products/list`)
- Returns paginated products with lightweight fields only
- Query params: `page`, `pageSize`, `q`, `brand_id`, `category_id`, `from`, `to`
- Does NOT load variants or images upfront
- Returns total count for pagination

**Details Endpoint** (`/api/admin/products/[id]`)
- Returns full product details with variants
- Loaded only when expanding a product row
- Includes variant details: SKU, price, images, specs

### Features

- **Pagination**: 25 products per page (10-100 configurable)
- **Search**: Debounced search across product name and slug
- **Filters**:
  - Brand filter (dropdown)
  - Category filter (dropdown)
  - Date range presets (Last 7/30/90 days)
- **Lazy Loading**: Variants loaded only when expanding product details
- **Error Handling**: Retry button on failed requests
- **Loading States**: Skeleton states during data fetch

## Recommended Database Indexes

For optimal performance with large product catalogs, add these indexes:

```sql
-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Product variants indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
```

### Why These Indexes?

- `idx_products_created_at`: Speeds up default sort order (newest first)
- `idx_products_name`: Improves search query performance
- `idx_products_slug`: Improves search query performance
- `idx_products_brand_id`: Speeds up brand filter queries
- `idx_products_category_id`: Speeds up category filter queries
- `idx_product_variants_product_id`: Critical for loading variants by product
- `idx_product_variants_sku`: Improves SKU lookups

## Performance Notes

1. The list endpoint intentionally returns **product-level fields only** (no variants) for performance
2. Variants are loaded lazily only when a product is expanded
3. Search uses PostgreSQL's `ilike` operator with wildcards - consider full-text search for very large catalogs
4. Page size is clamped between 10-100 to prevent excessive data transfer

## Usage

The admin products page now handles large catalogs efficiently:
- Initial load: Only 25 products (no variants)
- Search/filter: Server-side processing
- Expand product: Lazy-load variants on demand
- Edit/create: Existing flows preserved

All existing product management functionality remains intact.
