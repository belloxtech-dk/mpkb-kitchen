-- Kitchen accounts: maps users to kitchens + WA phone numbers
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS kitchen_id   TEXT,
  ADD COLUMN IF NOT EXISTS wa_phone     TEXT,   -- e.g. "6281234567890"
  ADD COLUMN IF NOT EXISTS display_name TEXT;

CREATE INDEX IF NOT EXISTS idx_user_kitchen_id ON "user"(kitchen_id);
CREATE INDEX IF NOT EXISTS idx_user_wa_phone   ON "user"(wa_phone);

-- Add submitter tracking to receipt_scans
ALTER TABLE receipt_scans
  ADD COLUMN IF NOT EXISTS submitted_by TEXT,   -- user id
  ADD COLUMN IF NOT EXISTS wa_phone     TEXT,   -- sender WA number
  ADD COLUMN IF NOT EXISTS source       TEXT NOT NULL DEFAULT 'web';  -- 'web' | 'whatsapp'

-- WA bot sessions: track ongoing conversations
CREATE TABLE IF NOT EXISTS wa_sessions (
  id          TEXT PRIMARY KEY,
  wa_phone    TEXT NOT NULL UNIQUE,
  kitchen_id  TEXT,
  user_id     TEXT,
  state       TEXT NOT NULL DEFAULT 'idle',   -- idle | awaiting_invoice
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_sessions_phone ON wa_sessions(wa_phone);

-- Price intelligence: actual prices submitted via WA/web
CREATE TABLE IF NOT EXISTS price_intelligence (
  id           TEXT PRIMARY KEY,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kitchen_id   TEXT NOT NULL,
  item_name    TEXT NOT NULL,     -- normalized item name
  unit         TEXT NOT NULL,
  price_idr    DOUBLE PRECISION NOT NULL,
  supplier     TEXT,
  receipt_id   TEXT,              -- fk to receipt_scans.id
  source       TEXT DEFAULT 'receipt'
);

CREATE INDEX IF NOT EXISTS idx_price_intel_item    ON price_intelligence(item_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_intel_kitchen ON price_intelligence(kitchen_id);
