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

-- 4. Enable Row Level Security (RLS) and allow public read & anon write
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Products Policies
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon insert products" ON public.products;
CREATE POLICY "Anon insert products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anon update products" ON public.products;
CREATE POLICY "Anon update products" ON public.products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anon delete products" ON public.products;
CREATE POLICY "Anon delete products" ON public.products FOR DELETE USING (true);

-- Categories Policies
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon upsert categories" ON public.categories;
CREATE POLICY "Anon upsert categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- Settings Policies
DROP POLICY IF EXISTS "Public read settings" ON public.settings;
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon upsert settings" ON public.settings;
CREATE POLICY "Anon upsert settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- 5. Create Public Storage Bucket for Product Photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies: allow public read and anon upload
DROP POLICY IF EXISTS "Public view product images" ON storage.objects;
CREATE POLICY "Public view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Anon upload product images" ON storage.objects;
CREATE POLICY "Anon upload product images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Anon update product images" ON storage.objects;
CREATE POLICY "Anon update product images" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Anon delete product images" ON storage.objects;
CREATE POLICY "Anon delete product images" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images');
