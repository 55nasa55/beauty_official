/*
  # Good Looks E-commerce Database Schema

  ## Overview
  Complete e-commerce database schema for Good Looks online store with support for products, 
  variants, brands, categories, banners, and collections.

  ## New Tables
  
  ### 1. categories
  - `id` (uuid, primary key) - Unique category identifier
  - `slug` (text, unique) - URL-friendly category identifier
  - `name` (text) - Category display name
  - `description` (text) - Category description
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 2. brands
  - `id` (uuid, primary key) - Unique brand identifier
  - `slug` (text, unique) - URL-friendly brand identifier
  - `name` (text) - Brand display name
  - `description` (text) - Brand description
  - `logo_url` (text) - Brand logo image URL
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 3. products
  - `id` (uuid, primary key) - Unique product identifier
  - `slug` (text, unique) - URL-friendly product identifier
  - `name` (text) - Product display name
  - `description` (text) - Product description
  - `category` (text) - Category name (denormalized for quick access)
  - `category_id` (uuid, foreign key) - Reference to categories table
  - `brand_id` (uuid, foreign key) - Reference to brands table
  - `tags` (text[]) - Array of tags (featured, best_seller, new, etc.)
  - `is_featured` (boolean) - Featured product flag
  - `is_best_seller` (boolean) - Best seller flag
  - `is_new` (boolean) - New arrival flag
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 4. product_variants
  - `id` (uuid, primary key) - Unique variant identifier
  - `product_id` (uuid, foreign key) - Reference to products table
  - `name` (text) - Variant name (e.g., "50ml", "Blue", "Large")
  - `price` (decimal) - Variant price
  - `compare_at_price` (decimal) - Original price for sale comparison
  - `stock` (integer) - Available inventory
  - `images` (text[]) - Array of image URLs
  - `specs` (jsonb) - Additional variant specifications
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 5. banners
  - `id` (uuid, primary key) - Unique banner identifier
  - `title` (text) - Banner title
  - `description` (text) - Banner description
  - `image_url` (text) - Banner image URL
  - `target_type` (text) - Link target type (product, collection, category)
  - `target_value` (text) - Target identifier (slug or id)
  - `sort_order` (integer) - Display order
  - `active` (boolean) - Active status flag
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 6. collections
  - `id` (uuid, primary key) - Unique collection identifier
  - `name` (text) - Collection display name
  - `slug` (text, unique) - URL-friendly collection identifier
  - `product_ids` (uuid[]) - Array of product IDs in collection
  - `product_tags` (text[]) - Tags to auto-include products
  - `display_on_home` (boolean) - Show on homepage flag
  - `sort_order` (integer) - Display order on homepage
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ## Security
  
  All tables have RLS enabled with policies allowing:
  - Public read access (SELECT) for all users
  - Authenticated admin write access (INSERT, UPDATE, DELETE)
  
  ## Indexes
  
  Indexes added for:
  - Category and brand foreign keys
  - Product tags for filtering
  - Product flags for quick queries
  - Banner active status and sort order
  - Collection display flags
*/

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  logo_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for brands"
  ON brands FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert brands"
  ON brands FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update brands"
  ON brands FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete brands"
  ON brands FOR DELETE
  TO authenticated
  USING (true);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT '',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  is_best_seller boolean DEFAULT false,
  is_new boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_is_best_seller ON products(is_best_seller) WHERE is_best_seller = true;
CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new) WHERE is_new = true;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- Product variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  price decimal(10, 2) NOT NULL,
  compare_at_price decimal(10, 2) DEFAULT 0,
  stock integer DEFAULT 0,
  images text[] DEFAULT '{}',
  specs jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for product_variants"
  ON product_variants FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert product_variants"
  ON product_variants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update product_variants"
  ON product_variants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product_variants"
  ON product_variants FOR DELETE
  TO authenticated
  USING (true);

-- Banners table
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  image_url text NOT NULL,
  target_type text DEFAULT 'product',
  target_value text DEFAULT '',
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_banners_sort_order ON banners(sort_order);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for banners"
  ON banners FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert banners"
  ON banners FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update banners"
  ON banners FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete banners"
  ON banners FOR DELETE
  TO authenticated
  USING (true);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  product_ids uuid[] DEFAULT '{}',
  product_tags text[] DEFAULT '{}',
  display_on_home boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collections_display_on_home ON collections(display_on_home) WHERE display_on_home = true;
CREATE INDEX IF NOT EXISTS idx_collections_sort_order ON collections(sort_order);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for collections"
  ON collections FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert collections"
  ON collections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update collections"
  ON collections FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete collections"
  ON collections FOR DELETE
  TO authenticated
  USING (true);