-- 选型速查表
CREATE TABLE IF NOT EXISTS selection_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(255) NOT NULL,
  scene varchar(100) NOT NULL,
  period varchar(50) NOT NULL DEFAULT '',
  publish_date date NOT NULL DEFAULT now(),
  summary varchar(500) NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  source_report_id uuid,
  is_featured boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  status varchar(20) NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS selection_guides_scene_status_date ON selection_guides (scene, status, publish_date DESC);
CREATE INDEX IF NOT EXISTS selection_guides_source_report ON selection_guides (source_report_id);

ALTER TABLE selection_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read published selections"
  ON selection_guides FOR SELECT
  USING (status = 'published' AND is_hidden = false);

CREATE POLICY "anon full access selections"
  ON selection_guides FOR ALL TO anon
  USING (true) WITH CHECK (true);
