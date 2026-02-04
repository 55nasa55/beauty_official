/*
  # Create Reviews Performance Indexes

  1. Indexes
    - `reviews_product_id_created_at_idx` - Sort reviews by date per product
    - `reviews_rating_idx` - Filter reviews by rating
    - `reviews_has_images_idx` - Filter reviews with images
    - `review_subratings_review_idx` - Join review subratings efficiently

  2. Performance
    - Optimizes sorting reviews by date
    - Enables fast filtering by rating
    - Supports "reviews with photos" filter
    - Improves subrating lookups
*/

create index if not exists reviews_product_id_created_at_idx
  on public.reviews(product_id, created_at desc)
  where deleted_at is null;

create index if not exists reviews_rating_idx
  on public.reviews(rating);

create index if not exists reviews_has_images_idx
  on public.reviews((array_length(images, 1) is not null));

create index if not exists review_subratings_review_idx
  on public.review_subratings(review_id);
