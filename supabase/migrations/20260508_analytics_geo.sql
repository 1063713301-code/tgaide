-- 为 analytics_events 表添加地域字段
ALTER TABLE analytics_events
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS city     text;

CREATE INDEX IF NOT EXISTS idx_ae_province ON analytics_events (province, created_at DESC);
