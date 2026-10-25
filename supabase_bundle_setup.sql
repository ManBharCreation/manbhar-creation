-- ============================================================================
-- MANBHAR CREATION - ALL-IN-ONE OFFERS & QUANTITY BUNDLES SETUP
-- Run this script in Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

-- 1. Create Offers Table if it does not exist yet
CREATE TABLE IF NOT EXISTS public.offers (
  id TEXT PRIMARY KEY DEFAULT 'current',
  announcement JSONB DEFAULT '{}'::JSONB,
  countdown JSONB DEFAULT '{}'::JSONB,
  coupons JSONB DEFAULT '[]'::JSONB,
  combo JSONB DEFAULT '{"enabled": false}'::JSONB,
  bundles JSONB DEFAULT '{
    "enabled": true,
    "tiers": [
      {"id": "b_3", "qty": 3, "price": 999},
      {"id": "b_4", "qty": 4, "price": 1199}
    ],
    "scope": "all",
    "scopeItems": [],
    "intermediateRule": "largest_tier_per_piece",
    "allowCouponWithBundle": false
  }'::JSONB,
  free_delivery JSONB DEFAULT '{"enabled": true, "minAmount": 1499}'::JSONB,
  popup JSONB DEFAULT '{"enabled": false}'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. If table already existed, ensure bundles column is added
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS bundles JSONB DEFAULT '{
  "enabled": true,
  "tiers": [
    {"id": "b_3", "qty": 3, "price": 999},
    {"id": "b_4", "qty": 4, "price": 1199}
  ],
  "scope": "all",
  "scopeItems": [],
  "intermediateRule": "largest_tier_per_piece",
  "allowCouponWithBundle": false
}'::jsonb;

-- 3. Pre-seed or Update current row with default bundle tiers
INSERT INTO public.offers (id, announcement, countdown, coupons, combo, bundles, free_delivery, popup, updated_at)
VALUES (
  'current',
  '{
    "enabled": true,
    "text": "🎉 Special Offer: 3 Kurte sirf ₹999 mein | 4 Kurte ₹1199 mein!",
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
    "text": "Get exclusive deals on premium handcrafted Men Kurtas!",
    "image": "",
    "ctaText": "Shop Festive Kurtas",
    "ctaLink": "#products"
  }'::jsonb,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  bundles = COALESCE(public.offers.bundles, EXCLUDED.bundles),
  updated_at = NOW();

-- 4. Enable Row Level Security (RLS) on public.offers:
-- Public can ONLY SELECT (Read), Writes ONLY for Authenticated Admin
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Clean existing policies
DROP POLICY IF EXISTS "Allow all operations on offers" ON public.offers;
DROP POLICY IF EXISTS "Public read offers" ON public.offers;
DROP POLICY IF EXISTS "Admin write offers" ON public.offers;

-- Public read-only policy
CREATE POLICY "Public read offers" ON public.offers
  FOR SELECT
  USING (true);

-- Authenticated Admin write policy
CREATE POLICY "Admin write offers" ON public.offers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
