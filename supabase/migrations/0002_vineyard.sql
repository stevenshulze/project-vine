-- ============================================================
-- 0002_vineyard.sql
-- Vineyard + niche categories + full-text search
-- Apply via Supabase Dashboard → SQL Editor
-- ============================================================

-- affiliate_profiles additions
ALTER TABLE affiliate_profiles
  ADD COLUMN IF NOT EXISTS username       TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS display_name   TEXT,
  ADD COLUMN IF NOT EXISTS bio            TEXT,
  ADD COLUMN IF NOT EXISTS niche_tags     TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS vineyard_public BOOLEAN DEFAULT TRUE;

-- jobs additions
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS industry       TEXT,
  ADD COLUMN IF NOT EXISTS role_function  TEXT,
  ADD COLUMN IF NOT EXISTS location_type  TEXT CHECK (location_type IN ('remote','hybrid','on-site'));

-- Full-text search vector (title + description + industry + role_function)
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        coalesce(title, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(industry, '') || ' ' ||
        coalesce(role_function, '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS jobs_search_vector_idx ON jobs USING gin(search_vector);

-- vineyard_listings
CREATE TABLE IF NOT EXISTS vineyard_listings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID        NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  job_id       UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sort_order   INT         DEFAULT 0,
  active       BOOLEAN     DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (affiliate_id, job_id)
);

ALTER TABLE vineyard_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vineyard_listings_public_read"
  ON vineyard_listings FOR SELECT USING (true);

CREATE POLICY "vineyard_listings_owner_all"
  ON vineyard_listings FOR ALL
  USING (
    affiliate_id IN (
      SELECT id FROM affiliate_profiles WHERE user_id = auth.uid()
    )
  );
