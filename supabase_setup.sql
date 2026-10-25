-- ============================================================================
-- MANBHAR CREATION - SUPABASE DATABASE & STORAGE SETUP SCRIPT
-- Copy and paste this script into your Supabase Dashboard: SQL Editor -> Run
-- ============================================================================

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  badge TEXT,
  image TEXT,
  images JSONB DEFAULT '[]'::JSONB,
  sizes JSONB DEFAULT '[]'::JSONB,
  stock JSONB DEFAULT '{}'::JSONB,
  is_out_of_stock BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  starting_price NUMERIC,
  image TEXT
);

-- Pre-seed default categories if empty
INSERT INTO public.categories (id, name, tagline, starting_price, image)
VALUES
  ('casual', 'Casual', 'Effortless everyday ethnic comfort in pure breathable cotton', 699, 'assets/logo.png'),
  ('short', 'Short', 'Modern straight-cut short kurtas, perfect with denim and chinos', 799, 'assets/logo.png'),
  ('embroidered', 'Embroidered', 'Intricate threadwork & Lucknowi chikankari for refined elegance', 1299, 'assets/logo.png'),
  ('festive', 'Festive', 'Vibrant royal tones, jacquard weaves and celebratory luster', 1499, 'assets/logo.png'),
  ('wedding', 'Wedding', 'Regal sherwani kurtas, silk blends & brocade for celebrations', 1999, 'assets/logo.png')
ON CONFLICT (id) DO NOTHING;

-- 3. Create Settings Table (For Hero Banner, Contacts & Features)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Clean existing policies
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public insert products" ON public.products;
DROP POLICY IF EXISTS "Public update products" ON public.products;
DROP POLICY IF EXISTS "Public delete products" ON public.products;
DROP POLICY IF EXISTS "Admin insert products" ON public.products;
DROP POLICY IF EXISTS "Admin update products" ON public.products;
DROP POLICY IF EXISTS "Admin delete products" ON public.products;
DROP POLICY IF EXISTS "Anon insert products" ON public.products;
DROP POLICY IF EXISTS "Anon update products" ON public.products;
DROP POLICY IF EXISTS "Anon delete products" ON public.products;

-- Products Policies: Public Read, Authenticated Admin Write
CREATE POLICY "Public read products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Admin insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin update products" ON public.products
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin delete products" ON public.products
  FOR DELETE TO authenticated USING (true);

-- Categories Policies: Public Read, Authenticated Admin Write
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Public write categories" ON public.categories;
DROP POLICY IF EXISTS "Admin write categories" ON public.categories;
DROP POLICY IF EXISTS "Anon upsert categories" ON public.categories;

CREATE POLICY "Public read categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admin write categories" ON public.categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Settings Policies: Public Read, Authenticated Admin Write
DROP POLICY IF EXISTS "Public read settings" ON public.settings;
DROP POLICY IF EXISTS "Public write settings" ON public.settings;
DROP POLICY IF EXISTS "Admin write settings" ON public.settings;
DROP POLICY IF EXISTS "Anon upsert settings" ON public.settings;

CREATE POLICY "Public read settings" ON public.settings
  FOR SELECT USING (true);

CREATE POLICY "Admin write settings" ON public.settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Create Public Storage Bucket for Product Photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies: Public view, Authenticated Admin upload/update/delete
DROP POLICY IF EXISTS "Public view product images" ON storage.objects;
DROP POLICY IF EXISTS "Public upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public update product images" ON storage.objects;
DROP POLICY IF EXISTS "Public delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anon upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Anon update product images" ON storage.objects;
DROP POLICY IF EXISTS "Anon delete product images" ON storage.objects;

-- Public can view all images in product-images bucket
CREATE POLICY "Public view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Logged-in admin can upload images
CREATE POLICY "Admin upload product images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

-- Logged-in admin can update images
CREATE POLICY "Admin update product images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

-- Logged-in admin can delete images
CREATE POLICY "Admin delete product images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images');
