-- ============================================================================
-- MANBHAR CREATION - OFFERS & DEALS SUPABASE SETUP
-- Run this script in Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

-- 1. Create Offers Table
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

-- 2. Add Flash Sale columns to Products table (supports both snake_case and camelCase)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_flash_sale BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flash_sale_end TIMESTAMPTZ;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "isFlashSale" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "flashSaleEnd" TIMESTAMPTZ;

-- 3. Enable Row Level Security (RLS) on offers
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Clean existing offers policies
DROP POLICY IF EXISTS "Public read offers" ON public.offers;
DROP POLICY IF EXISTS "Admin write offers" ON public.offers;
DROP POLICY IF EXISTS "Allow all operations on offers" ON public.offers;

-- Public can ONLY SELECT (Read)
CREATE POLICY "Public read offers" ON public.offers
  FOR SELECT USING (true);

-- Authenticated Admin can WRITE (Insert, Update, Delete)
CREATE POLICY "Admin write offers" ON public.offers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Pre-seed Default Offers Data
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
