-- Receipt scanning & price verification table
CREATE TABLE IF NOT EXISTS receipt_scans (
  id            TEXT PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kitchen       TEXT NOT NULL,
  supplier      TEXT,
  receipt_date  TEXT,
  receipt_number TEXT,
  total_idr     DOUBLE PRECISION NOT NULL DEFAULT 0,
  overpayment_idr DOUBLE PRECISION NOT NULL DEFAULT 0,
  risk_level    TEXT NOT NULL DEFAULT 'low',   -- low | medium | high | critical
  item_count    INT NOT NULL DEFAULT 0,
  flagged_count INT NOT NULL DEFAULT 0,
  items         JSONB NOT NULL DEFAULT '[]',   -- ExtractedItem[]
  checks        JSONB NOT NULL DEFAULT '[]',   -- PriceCheck[]
  summary       TEXT NOT NULL DEFAULT '',
  image_hash    TEXT                            -- SHA-256 of original image bytes
);

CREATE INDEX IF NOT EXISTS idx_receipt_scans_created_at ON receipt_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipt_scans_kitchen    ON receipt_scans(kitchen);
CREATE INDEX IF NOT EXISTS idx_receipt_scans_risk       ON receipt_scans(risk_level);
