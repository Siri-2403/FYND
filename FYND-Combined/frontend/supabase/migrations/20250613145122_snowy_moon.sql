/*
  # Add CSV Products Table

  1. New Table
    - `csv_products` table to store data from your CSV file
    - Flexible schema that can be customized based on your CSV columns
    - Includes common product fields that can be mapped

  2. Security
    - Enable RLS on the new table
    - Add policies for public read access
    - Allow authenticated users to manage data

  3. Integration
    - The table will work with existing search functionality
    - Products from both tables can be displayed together
*/

-- Create csv_products table with flexible schema
CREATE TABLE IF NOT EXISTS csv_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core product fields (customize these based on your CSV columns)
  product_name text,
  product_title text,
  category text,
  subcategory text,
  brand text,
  manufacturer text,
  price numeric(10,2),
  original_price numeric(10,2),
  currency text DEFAULT 'USD',
  
  -- Product details
  description text,
  short_description text,
  specifications text,
  features text,
  
  -- Visual and style
  color text,
  colors text[], -- Array for multiple colors
  size text,
  sizes text[], -- Array for multiple sizes
  style text,
  model text,
  sku text,
  
  -- Availability and logistics
  stock integer DEFAULT 0,
  availability text,
  location text,
  warehouse text,
  delivery_time text,
  shipping_cost numeric(10,2),
  
  -- Ratings and reviews
  rating numeric(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  
  -- Images and media
  image_url text,
  image_urls text[], -- Array for multiple images
  thumbnail_url text,
  
  -- Discounts and offers
  discount_percentage numeric(5,2),
  discount_amount numeric(10,2),
  discount_text text,
  offer_text text,
  
  -- Categories and tags
  main_category text,
  sub_category text,
  tags text[],
  keywords text[],
  
  -- External references
  external_id text,
  source text DEFAULT 'csv',
  source_url text,
  
  -- Additional flexible fields (for any extra CSV columns)
  extra_field_1 text,
  extra_field_2 text,
  extra_field_3 text,
  extra_field_4 text,
  extra_field_5 text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE csv_products ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Anyone can read csv products"
  ON csv_products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert csv products"
  ON csv_products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update csv products"
  ON csv_products
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_csv_products_category ON csv_products(category);
CREATE INDEX IF NOT EXISTS idx_csv_products_main_category ON csv_products(main_category);
CREATE INDEX IF NOT EXISTS idx_csv_products_brand ON csv_products(brand);
CREATE INDEX IF NOT EXISTS idx_csv_products_price ON csv_products(price);
CREATE INDEX IF NOT EXISTS idx_csv_products_rating ON csv_products(rating);
CREATE INDEX IF NOT EXISTS idx_csv_products_location ON csv_products(location);
CREATE INDEX IF NOT EXISTS idx_csv_products_external_id ON csv_products(external_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_csv_products_name_search ON csv_products USING gin(to_tsvector('english', coalesce(product_name, product_title, '')));
CREATE INDEX IF NOT EXISTS idx_csv_products_description_search ON csv_products USING gin(to_tsvector('english', coalesce(description, short_description, '')));

-- Create updated_at trigger
CREATE TRIGGER update_csv_products_updated_at
  BEFORE UPDATE ON csv_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();