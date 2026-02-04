/*
  # Create Additional Reviews Performance Indexes

  1. Indexes
    - `reviews_product_active_idx` - Faster product page aggregation
    - `reviews_user_product_idx` - Faster unique lookup and user review history
    - `reviews_variant_idx` - Faster variant-based filtering (optional)

  2. Performance Benefits
    - Speeds up product review aggregation (ratings, counts)
    - Optimizes duplicate review detection
    - Improves user review history queries
    - Supports variant-specific review filtering
*/

-- Faster product page aggregation
create index if not exists reviews_product_active_idx
  on public.reviews(product_id)
  where deleted_at is null;

-- Faster unique lookup
create index if not exists reviews_user_product_idx
  on public.reviews(user_id, product_id);

-- Faster variant-based filtering (optional usage)
create index if not exists reviews_variant_idx
  on public.reviews(variant_id)
  where deleted_at is null;
