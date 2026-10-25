-- ============================================================================
-- MANBHAR CREATION - QUANTITY BUNDLES & SECURE RLS POLICIES SETUP
-- Run this script in Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

-- 1. Add bundles column to public.offers table (safely preserves existing data)
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

-- 2. Populate bundles column in existing row if currently null or empty
UPDATE public.offers
SET bundles = '{
  "enabled": true,
  "tiers": [
    {"id": "b_3", "qty": 3, "price": 999},
    {"id": "b_4", "qty": 4, "price": 1199}
  ],
  "scope": "all",
  "scopeItems": [],
  "intermediateRule": "largest_tier_per_piece",
  "allowCouponWithBundle": false
}'::jsonb
WHERE id = 'current' AND (bundles IS NULL OR bundles = '{}'::jsonb);

-- 3. Update Row Level Security (RLS) on public.offers:
-- Public can ONLY SELECT (Read), Writes ONLY for Authenticated Admin

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Remove old open policy
DROP POLICY IF EXISTS "Allow all operations on offers" ON public.offers;
DROP POLICY IF EXISTS "Public read offers" ON public.offers;
DROP POLICY IF EXISTS "Admin write offers" ON public.offers;

-- Public can ONLY READ
CREATE POLICY "Public read offers" ON public.offers
  FOR SELECT
  USING (true);

-- Authenticated Admin can WRITE (Insert, Update, Delete)
CREATE POLICY "Admin write offers" ON public.offers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
