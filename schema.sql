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

CREATE INDEX IF NOT EXISTS idx_specials_rid     ON specials(rid);
CREATE INDEX IF NOT EXISTS idx_specials_active  ON specials(active);
CREATE INDEX IF NOT EXISTS idx_specials_food    ON specials(food);
CREATE INDEX IF NOT EXISTS idx_specials_session ON specials(session);
CREATE INDEX IF NOT EXISTS idx_rest_suburb      ON restaurants(suburb);
CREATE INDEX IF NOT EXISTS idx_rest_active      ON restaurants(active);

-- Seed default admin credentials (change after first login)
INSERT INTO settings (key, value) VALUES ('admin_user', 'admin')
  ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('admin_pass', 'specials2025')
  ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('maps_api_key', '')
  ON CONFLICT (key) DO NOTHING;
