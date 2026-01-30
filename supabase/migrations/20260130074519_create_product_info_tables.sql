/*
  # Create Product Info Sections and Images Tables

  1. New Tables
    - `product_info_sections`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `title` (text, section title)
      - `content` (text, section content)
      - `order_index` (integer, for ordering)
      - `created_at` (timestamptz)

    - `product_info_images`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `image_url` (text, image URL)
      - `order_index` (integer, for ordering)
      - `created_at` (timestamptz)

  2. Indexes
    - Index on product_info_sections(product_id, order_index)
    - Index on product_info_images(product_id, order_index)

  3. Security
    - Enable RLS on both tables
    - Public can view all sections and images
    - Only API routes with requireAdmin() can modify (enforced at application level)
*/

-- Create product_info_sections table
CREATE TABLE IF NOT EXISTS product_info_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create product_info_images table
CREATE TABLE IF NOT EXISTS product_info_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_product_info_sections_product_order
  ON product_info_sections(product_id, order_index);

CREATE INDEX IF NOT EXISTS idx_product_info_images_product_order
  ON product_info_images(product_id, order_index);

-- Enable Row Level Security
ALTER TABLE product_info_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_info_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_info_sections (public read, admin write via API)
CREATE POLICY "Anyone can view product info sections"
  ON product_info_sections FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can insert product info sections"
  ON product_info_sections FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update product info sections"
  ON product_info_sections FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete product info sections"
  ON product_info_sections FOR DELETE
  TO service_role
  USING (true);

-- RLS Policies for product_info_images (public read, admin write via API)
CREATE POLICY "Anyone can view product info images"
  ON product_info_images FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can insert product info images"
  ON product_info_images FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update product info images"
  ON product_info_images FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete product info images"
  ON product_info_images FOR DELETE
  TO service_role
  USING (true);