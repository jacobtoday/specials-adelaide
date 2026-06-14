-- ════════════════════════════════════════════
-- Specials Adelaide — Database Schema
-- Run this once in Railway's Postgres query console
-- (Railway dashboard → Postgres service → Data → Query)
-- ════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS restaurants (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  suburb      TEXT NOT NULL,
  cuisine     TEXT DEFAULT '',
  addr        TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  website     TEXT DEFAULT '',
  lat         NUMERIC(9,6),
  lng         NUMERIC(9,6),
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS specials (
  id          TEXT PRIMARY KEY,
  rid         TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  desc_text   TEXT DEFAULT '',
  price       NUMERIC(6,2) NOT NULL DEFAULT 0,
  food        TEXT DEFAULT '',
  session     TEXT DEFAULT '',
  days        TEXT[] NOT NULL DEFAULT '{}',
  from_time   TEXT DEFAULT '',
  until_time  TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS logos (
  rid         TEXT PRIMARY KEY REFERENCES restaurants(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,     -- 'svg' or 'img'
  data        TEXT NOT NULL,     -- svg markup or data: URL
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT ''
);

-- Public submissions: new special suggestions + "no longer available" reports
CREATE TABLE IF NOT EXISTS submissions (
  id          SERIAL PRIMARY KEY,
  type        TEXT NOT NULL,             -- 'new_special' or 'report'
  status      TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
  -- for type = 'report'
  special_id  TEXT,
  -- shared / new_special fields
  rid         TEXT,
  venue_name  TEXT DEFAULT '',
  special_name TEXT DEFAULT '',
  desc_text   TEXT DEFAULT '',
  price       NUMERIC(6,2),
  food        TEXT DEFAULT '',
  session     TEXT DEFAULT '',
  days        TEXT[] DEFAULT '{}',
  from_time   TEXT DEFAULT '',
  until_time  TEXT DEFAULT '',
  -- contact + free text
  message     TEXT DEFAULT '',
  contact     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_type   ON submissions(type);


CREATE INDEX IF NOT EXISTS idx_specials_rid     ON specials(rid);
CREATE INDEX IF NOT EXISTS idx_specials_active  ON specials(active);
CREATE INDEX IF NOT EXISTS idx_specials_food    ON specials(food);
CREATE INDEX IF NOT EXISTS idx_specials_session ON specials(session);
CREATE INDEX IF NOT EXISTS idx_rest_suburb      ON restaurants(suburb);
CREATE INDEX IF NOT EXISTS idx_rest_active      ON restaurants(active);

-- Migration: add lat/lng columns if upgrading an existing database
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS lat NUMERIC(9,6);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS lng NUMERIC(9,6);
ALTER TABLE specials ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Seed default admin credentials (change after first login)
INSERT INTO settings (key, value) VALUES ('admin_user', 'admin')
  ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('admin_pass', 'specials2025')
  ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('maps_api_key', '')
  ON CONFLICT (key) DO NOTHING;
