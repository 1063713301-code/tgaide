-- analytics_events 表扩展字段（来源分析 + 用户画像 + 性能监控）
-- 在 Supabase SQL Editor 中执行此文件

ALTER TABLE analytics_events
  ADD COLUMN IF NOT EXISTS referrer    text,
  ADD COLUMN IF NOT EXISTS channel     text,
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS browser     text;

-- 加速来源分析查询
CREATE INDEX IF NOT EXISTS idx_ae_channel     ON analytics_events (channel,     created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_device      ON analytics_events (device_type,  created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_visitor     ON analytics_events (visitor_id,   created_at DESC);
