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
  "originalPrice" NUMERIC,
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

-- Seed default site_settings with real Mumbai store address
INSERT INTO public.settings (key, value)
VALUES (
  'site_settings',
  '{
    "hero": {
      "tagline": "Tradition. Style. Comfort.",
      "title": "MEN KURTA",
      "subtitle": "Ethnic wear for every occasion",
      "occasions": ["Festive", "Wedding", "Casual", "Everyday"],
      "startingPrice": 799,
      "autoMinPrice": true,
      "ctaText": "Shop Now",
      "ctaScrollTarget": "#products",
      "bgImage": ""
    },
    "contacts": {
      "displayPhone": "+91 93218 03696",
      "phone": "919321803696",
      "mapsUrl": "https://maps.app.goo.gl/jEg8beEL2Htdr6rZ9",
      "instagramUrl": "https://www.instagram.com/manbhar_creation",
      "address": "Gate No.2, Ganesh Galli, Shop no.665, Akurli Rd, Near Raghubir School, Hanuman Nagar, Kandivali East, Mumbai, Maharashtra 400101",
      "timings": "Mon - Sun: 10:30 AM to 9:30 PM"
    },
    "features": [
      "Premium cotton blend",
      "Breathable & comfortable",
      "Stylish designs",
      "Durable fabric",
      "Trusted quality"
    ],
    "footerTagline": "Crafted for traditional elegance & timeless festive celebrations."
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value;

-- 4. Enable Row Level Security (RLS) on Tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Clean existing table policies
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
DROP POLICY IF EXISTS "Allow all operations on products" ON public.products;

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Public write categories" ON public.categories;
DROP POLICY IF EXISTS "Admin write categories" ON public.categories;
DROP POLICY IF EXISTS "Anon upsert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow all operations on categories" ON public.categories;

DROP POLICY IF EXISTS "Public read settings" ON public.settings;
DROP POLICY IF EXISTS "Public write settings" ON public.settings;
DROP POLICY IF EXISTS "Admin write settings" ON public.settings;
DROP POLICY IF EXISTS "Anon upsert settings" ON public.settings;
DROP POLICY IF EXISTS "Allow all operations on settings" ON public.settings;

-- Allow full operations on Products (read by public, write by admin/anon)
CREATE POLICY "Allow all operations on products" ON public.products
  FOR ALL USING (true) WITH CHECK (true);

-- Allow full operations on Categories
CREATE POLICY "Allow all operations on categories" ON public.categories
  FOR ALL USING (true) WITH CHECK (true);

-- Allow full operations on Settings
CREATE POLICY "Allow all operations on settings" ON public.settings
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Create Public Storage Bucket 'product-images'
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Clean existing storage policies
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
DROP POLICY IF EXISTS "Allow all uploads to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all reads from product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes from product-images" ON storage.objects;

-- STORAGE POLICIES (Guarantees NO RLS error on upload, update, delete or view)
-- Public can view all images in product-images bucket
CREATE POLICY "Allow all reads from product-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Allow upload into product-images bucket (applies to both authenticated & anon)
CREATE POLICY "Allow all uploads to product-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

-- Allow update of images in product-images bucket
CREATE POLICY "Allow all updates to product-images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

-- Allow delete of images in product-images bucket
CREATE POLICY "Allow all deletes from product-images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images');

-- ============================================================================
-- 6. OFFERS & DEALS SETUP
-- ============================================================================

-- Create Offers Table
CREATE TABLE IF NOT EXISTS public.offers (
  id TEXT PRIMARY KEY DEFAULT 'current',
  announcement JSONB DEFAULT '{}'::JSONB,
  countdown JSONB DEFAULT '{}'::JSONB,
  coupons JSONB DEFAULT '[]'::JSONB,
  combo JSONB DEFAULT '{}'::JSONB,
  bundles JSONB DEFAULT '{}'::JSONB,
  free_delivery JSONB DEFAULT '{}'::JSONB,
  popup JSONB DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure bundles column exists if table was already created
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS bundles JSONB DEFAULT '{}'::JSONB;

-- Flash Sale columns for products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_flash_sale BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flash_sale_end TIMESTAMPTZ;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "isFlashSale" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "flashSaleEnd" TIMESTAMPTZ;

-- Enable RLS on offers
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on offers" ON public.offers;
DROP POLICY IF EXISTS "Public read offers" ON public.offers;
DROP POLICY IF EXISTS "Admin write offers" ON public.offers;

-- Public can ONLY SELECT (Read)
CREATE POLICY "Public read offers" ON public.offers
  FOR SELECT USING (true);

-- Authenticated Admin can WRITE (Insert, Update, Delete)
CREATE POLICY "Admin write offers" ON public.offers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pre-seed Default Offers Data
INSERT INTO public.offers (id, announcement, countdown, coupons, combo, bundles, free_delivery, popup, updated_at)
VALUES (
  'current',
  '{
    "enabled": true,
    "text": "🎉 Special Festive Offer: Flat 20% OFF on all Kurta Sets | Use Code: FESTIVE20",
    "bgColor": "maroon",
    "link": "#products"
  }'::jsonb,
  '{
    "enabled": false,
    "endTime": ""
  }'::jsonb,
  '[
    {
      "id": "c_festive20",
      "code": "FESTIVE20",
      "type": "percent",
      "value": 20,
      "minOrder": 999,
      "expiry": "2026-12-31",
      "enabled": true
    },
    {
      "id": "c_kurta100",
      "code": "KURTA100",
      "type": "flat",
      "value": 100,
      "minOrder": 799,
      "expiry": "2026-12-31",
      "enabled": true
    }
  ]'::jsonb,
  '{
    "enabled": false,
    "buyQty": 2,
    "discountPercent": 15
  }'::jsonb,
  '{
    "enabled": true,
    "tiers": [
      {"id": "b_3", "qty": 3, "price": 999},
      {"id": "b_4", "qty": 4, "price": 1199}
    ],
    "scope": "all",
    "scopeItems": [],
    "intermediateRule": "largest_tier_per_piece",
    "allowCouponWithBundle": false
  }'::jsonb,
  '{
    "enabled": true,
    "minAmount": 1499
  }'::jsonb,
  '{
    "enabled": false,
    "version": "1",
    "heading": "✨ Festive Grand Celebration ✨",
    "text": "Get flat 20% OFF on premium handcrafted Men Kurtas. Use coupon code FESTIVE20 at checkout!",
    "image": "",
    "ctaText": "Shop Festive Kurtas",
    "ctaLink": "#products"
  }'::jsonb,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  announcement = EXCLUDED.announcement,
  countdown = EXCLUDED.countdown,
  coupons = EXCLUDED.coupons,
  combo = EXCLUDED.combo,
  bundles = EXCLUDED.bundles,
  free_delivery = EXCLUDED.free_delivery,
  popup = EXCLUDED.popup,
  updated_at = NOW();
