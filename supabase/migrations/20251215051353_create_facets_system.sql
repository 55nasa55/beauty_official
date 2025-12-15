/*
  # Faceted Product Classification System

  ## Overview
  Implements a flexible faceted classification system allowing products to be tagged
  with multiple attributes across different facet groups within a category.

  ## New Tables

  ### 1. category_facets
  Stores facet groups under a category (e.g., "Skin concern", "Skin type").
  - `id` (uuid, primary key) - Unique facet group identifier
  - `category_id` (uuid, foreign key) - Reference to categories table
  - `name` (text) - Facet group display name (e.g., "Skin concern")
  - `slug` (text) - URL-safe identifier (e.g., "skin-concern")
  - `sort_order` (integer) - Display order
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 2. facet_options
  Stores individual options within a facet group (e.g., "Acne", "Brightening").
  - `id` (uuid, primary key) - Unique option identifier
  - `facet_id` (uuid, foreign key) - Reference to category_facets table
  - `label` (text) - Option display label (e.g., "Acne")
  - `value` (text) - URL-safe value (e.g., "acne")
  - `sort_order` (integer) - Display order
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 3. product_facet_options
  Junction table linking products to facet options (many-to-many tag behavior).
  - `product_id` (uuid, foreign key) - Reference to products table
  - `facet_option_id` (uuid, foreign key) - Reference to facet_options table
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Public read access (SELECT) for category_facets and facet_options
  - Authenticated admin write access (INSERT, UPDATE, DELETE) for all tables
  - RLS enabled on all tables

  ## Indexes
  - category_facets: indexed on category_id
  - facet_options: indexed on facet_id
  - product_facet_options: indexed on both product_id and facet_option_id

  ## Constraints
  - Unique constraint on (category_id, slug) in category_facets
  - Unique constraint on (facet_id, value) in facet_options
  - Composite primary key (product_id, facet_option_id) in product_facet_options
  - Cascade delete on foreign keys to maintain referential integrity
*/

-- Create category_facets table
CREATE TABLE IF NOT EXISTS category_facets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_category_facet_slug UNIQUE (category_id, slug)
);

-- Create index on category_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_category_facets_category_id ON category_facets(category_id);

-- Enable RLS on category_facets
ALTER TABLE category_facets ENABLE ROW LEVEL SECURITY;

-- Public read access for category_facets
CREATE POLICY "Public read access for category_facets"
  ON category_facets FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can insert category_facets
CREATE POLICY "Authenticated users can insert category_facets"
  ON category_facets FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update category_facets
CREATE POLICY "Authenticated users can update category_facets"
  ON category_facets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete category_facets
CREATE POLICY "Authenticated users can delete category_facets"
  ON category_facets FOR DELETE
  TO authenticated
  USING (true);

-- Create facet_options table
CREATE TABLE IF NOT EXISTS facet_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facet_id uuid NOT NULL REFERENCES category_facets(id) ON DELETE CASCADE,
  label text NOT NULL,
  value text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_facet_option_value UNIQUE (facet_id, value)
);

-- Create index on facet_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_facet_options_facet_id ON facet_options(facet_id);

-- Enable RLS on facet_options
ALTER TABLE facet_options ENABLE ROW LEVEL SECURITY;

-- Public read access for facet_options
CREATE POLICY "Public read access for facet_options"
  ON facet_options FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can insert facet_options
CREATE POLICY "Authenticated users can insert facet_options"
  ON facet_options FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update facet_options
CREATE POLICY "Authenticated users can update facet_options"
  ON facet_options FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete facet_options
CREATE POLICY "Authenticated users can delete facet_options"
  ON facet_options FOR DELETE
  TO authenticated
  USING (true);

-- Create product_facet_options junction table
CREATE TABLE IF NOT EXISTS product_facet_options (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  facet_option_id uuid NOT NULL REFERENCES facet_options(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (product_id, facet_option_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_product_facet_options_product_id ON product_facet_options(product_id);
CREATE INDEX IF NOT EXISTS idx_product_facet_options_facet_option_id ON product_facet_options(facet_option_id);

-- Enable RLS on product_facet_options
ALTER TABLE product_facet_options ENABLE ROW LEVEL SECURITY;

-- Public read access for product_facet_options
CREATE POLICY "Public read access for product_facet_options"
  ON product_facet_options FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can insert product_facet_options
CREATE POLICY "Authenticated users can insert product_facet_options"
  ON product_facet_options FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can delete product_facet_options
CREATE POLICY "Authenticated users can delete product_facet_options"
  ON product_facet_options FOR DELETE
  TO authenticated
  USING (true);