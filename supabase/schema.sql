-- ============================================================
-- TG AI工具库 Supabase 数据库初始化脚本
-- 执行方法：在 Supabase 控制台 SQL Editor 中粘贴并运行
-- ============================================================

-- ── 1. 创建行业报告表 ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS industry_reports (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  title        varchar(255) NOT NULL,
  publish_date date         NOT NULL DEFAULT now(),
  category     varchar(100) NOT NULL,
  summary      varchar(500) NOT NULL,
  content      text         NOT NULL DEFAULT '',
  pdf_url      varchar(500) NOT NULL DEFAULT '',
  status       varchar(20)  NOT NULL DEFAULT 'published',
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);

-- ── 2. 创建每日简报表（结构与行业报告完全一致） ──────────────
CREATE TABLE IF NOT EXISTS daily_briefs (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  title        varchar(255) NOT NULL,
  publish_date date         NOT NULL DEFAULT now(),
  category     varchar(100) NOT NULL,
  summary      varchar(500) NOT NULL,
  content      text         NOT NULL DEFAULT '',
  pdf_url      varchar(500) NOT NULL DEFAULT '',
  status       varchar(20)  NOT NULL DEFAULT 'published',
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);

-- ── 3. 索引（加速查询） ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reports_status_date  ON industry_reports(status, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_category     ON industry_reports(category);
CREATE INDEX IF NOT EXISTS idx_briefs_status_date   ON daily_briefs(status, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_briefs_category      ON daily_briefs(category);

-- ── 4. 自动更新 updated_at 触发器 ────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reports_updated_at ON industry_reports;
CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON industry_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_briefs_updated_at ON daily_briefs;
CREATE TRIGGER trg_briefs_updated_at
  BEFORE UPDATE ON daily_briefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 5. Row Level Security（RLS） ─────────────────────────────
-- 方案：匿名读取已发布内容，任意用户可写（由前端密码保护）
-- 如需更严格安全，可改为需要 Supabase Auth

ALTER TABLE industry_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefs     ENABLE ROW LEVEL SECURITY;

-- 公开读取已发布内容
DROP POLICY IF EXISTS "Public read published reports" ON industry_reports;
CREATE POLICY "Public read published reports" ON industry_reports
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Public read published briefs" ON daily_briefs;
CREATE POLICY "Public read published briefs" ON daily_briefs
  FOR SELECT USING (status = 'published');

-- 允许 anon 角色进行所有操作（后台用 anon key，前端密码保护）
-- 如果安全要求更高，请删除下面两行并改用 Supabase Auth
DROP POLICY IF EXISTS "Anon full access reports" ON industry_reports;
CREATE POLICY "Anon full access reports" ON industry_reports
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access briefs" ON daily_briefs;
CREATE POLICY "Anon full access briefs" ON daily_briefs
  FOR ALL USING (true) WITH CHECK (true);

-- ── 6. 创建图片存储桶 ───────────────────────────────────────
-- 注意：Storage 桶需在 Supabase 控制台 Storage 页面手动创建，或通过以下 SQL：
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,           -- 公开访问
  10485760,       -- 最大 10MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 允许 anon 用户上传图片
DROP POLICY IF EXISTS "Allow anon upload images" ON storage.objects;
CREATE POLICY "Allow anon upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'article-images');

DROP POLICY IF EXISTS "Allow public read images" ON storage.objects;
CREATE POLICY "Allow public read images" ON storage.objects
  FOR SELECT USING (bucket_id = 'article-images');

-- ── 7. 示例数据（可选，用于测试） ──────────────────────────
INSERT INTO industry_reports (title, publish_date, category, summary, content, pdf_url, status)
VALUES (
  'AI工具在律师行业的应用全景报告（2026）',
  '2026-04-20',
  '律师',
  '本报告深度梳理了当前主流AI写作、合同审查、法律检索工具在律师行业的落地现状，分析各类工具的优劣势与适用场景，帮助法律从业者快速找到最适合自己的AI助手。',
  '<h2>报告摘要</h2><p>人工智能正在深刻改变法律行业的工作方式……</p><h2>主流工具梳理</h2><p>以下是目前律师行业最常用的几类AI工具……</p>',
  '',
  'published'
) ON CONFLICT DO NOTHING;

INSERT INTO daily_briefs (title, publish_date, category, summary, content, pdf_url, status)
VALUES (
  '今日AI简报：Claude 4.7发布 | GPT-5定价曝光 | Cursor再融资',
  '2026-04-20',
  '程序员',
  '今日AI要闻：Anthropic发布Claude 4.7，编程能力大幅提升；OpenAI GPT-5定价方案曝光，月费或高达200美元；Cursor完成新一轮3亿美元融资，估值达90亿。',
  '<h2>今日速览</h2><ul><li>Claude 4.7正式发布，SWE-bench得分创新高</li><li>GPT-5即将推出，定价方案引发热议</li><li>Cursor完成新轮融资</li></ul>',
  '',
  'published'
) ON CONFLICT DO NOTHING;

-- ── 8. 创建工具表 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tools (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          varchar(255) NOT NULL,
  category      varchar(100) NOT NULL,
  description   text         NOT NULL DEFAULT '',
  rating        numeric(3,1) NOT NULL DEFAULT 5.0,
  price         varchar(100) NOT NULL DEFAULT '免费',
  official_url  varchar(500) NOT NULL DEFAULT '',
  icon_url      varchar(500) NOT NULL DEFAULT '',
  features      text[]       DEFAULT ARRAY[]::text[],
  is_recommended boolean     NOT NULL DEFAULT false,
  is_hot        boolean      NOT NULL DEFAULT false,
  is_new        boolean      NOT NULL DEFAULT false,
  sort_order    integer      NOT NULL DEFAULT 0,
  status        varchar(20)  NOT NULL DEFAULT 'active',
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tools_status_category ON tools(status, category);
CREATE INDEX IF NOT EXISTS idx_tools_sort ON tools(sort_order DESC, created_at DESC);

-- 自动更新 updated_at
DROP TRIGGER IF EXISTS trg_tools_updated_at ON tools;
CREATE TRIGGER trg_tools_updated_at
  BEFORE UPDATE ON tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active tools" ON tools;
CREATE POLICY "Public read active tools" ON tools FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "Anon full access tools" ON tools;
CREATE POLICY "Anon full access tools" ON tools FOR ALL USING (true) WITH CHECK (true);

-- ── 9. 工具测试数据 ──────────────────────────────────────────
INSERT INTO tools (name, category, description, rating, price, official_url, is_recommended, is_hot, is_new, sort_order, status)
VALUES
  ('法查查AI',     '律师',  '智能合同审查与法律检索工具，3分钟生成专业法律意见书，覆盖常见法律场景，支持批量审查', 5.0, '免费',    'https://example.com', true,  true,  false, 100, 'active'),
  ('律师笔记AI',  '律师',  '庭审记录、法律文书自动生成，支持语音转文字，提升律所工作效率50%以上',              4.8, '¥199/月', 'https://example.com', false, true,  true,  80,  'active'),
  ('DesignAI Pro','设计师', '一键生成海报、LOGO、UI设计稿，海量模板覆盖多种场景，设计效率提升300%',             4.8, '¥99/月',  'https://example.com', true,  true,  false, 95,  'active'),
  ('Canva AI',    '设计师', 'AI智能抠图、图片编辑、海报制作，支持团队协作，无需设计基础',                       4.6, '免费',    'https://example.com', false, false, false, 70,  'active'),
  ('财税智能助手', '会计',  '自动记账报税、智能票据识别，发票识别准确率99%，会计必备神器',                       4.7, '¥199/月', 'https://example.com', true,  true,  false, 90,  'active'),
  ('账单宝AI',    '会计',  '银行账单自动分类、财务报表生成、税务筹划建议，小微企业财务管理利器',                 4.5, '¥99/月',  'https://example.com', false, false, true,  60,  'active'),
  ('文案生成器',  '营销',  '一键生成营销文案、短视频脚本、朋友圈文案，支持多种风格，10秒生成爆款',               4.6, '免费',    'https://example.com', true,  true,  false, 92,  'active'),
  ('小裂变',      '营销',  '全链路私域自动化工具，覆盖裂变获客、用户运营、数据分析全流程',                       4.4, '价格面议', 'https://example.com', false, true,  true,  75,  'active'),
  ('代码助手',    '程序员', '代码生成、调试、解释，支持多种编程语言，智能补全效率翻倍，接入主流IDE',              4.9, '免费',    'https://example.com', true,  true,  false, 98,  'active'),
  ('Cursor AI',   '程序员', 'AI原生代码编辑器，支持与代码库对话，自动补全、重构与Bug修复，程序员必备',           4.9, '免费',    'https://example.com', false, true,  true,  96,  'active'),
  ('论文写作助手', '学生',  '论文写作、文献综述、数据分析一站式服务，支持中英文，自动生成参考文献',               4.5, '¥99/月',  'https://example.com', true,  false, false, 85,  'active'),
  ('科研数据通',  '学生',  'SPSS/R数据分析AI辅助，实验设计、数据可视化、统计检验自动化，科研效率提升3倍',        4.6, '免费',    'https://example.com', false, false, true,  65,  'active')
ON CONFLICT DO NOTHING;

-- ── 10. 工具图标存储桶 ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tool-icons',
  'tool-icons',
  true,
  5242880,   -- 最大 5MB（压缩后 256px 图标远小于此值）
  ARRAY['image/jpeg','image/png','image/gif','image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow anon upload tool icons" ON storage.objects;
CREATE POLICY "Allow anon upload tool icons" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'tool-icons');

DROP POLICY IF EXISTS "Allow public read tool icons" ON storage.objects;
CREATE POLICY "Allow public read tool icons" ON storage.objects
  FOR SELECT USING (bucket_id = 'tool-icons');

-- ── 11b. 工具英文字段（国际化） ─────────────────────────────────
ALTER TABLE tools ADD COLUMN IF NOT EXISTS name_en        varchar(255) NOT NULL DEFAULT '';
-- ── 11c. 搜索关键词字段 ──────────────────────────────────────────
ALTER TABLE tools ADD COLUMN IF NOT EXISTS keywords       text         NOT NULL DEFAULT '';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS description_en text         NOT NULL DEFAULT '';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS highlights_en  text         NOT NULL DEFAULT '';

-- ── 11. 用户评测表 ───────────────────────────────────────────
DROP TABLE IF EXISTS reviews CASCADE;
CREATE TABLE reviews (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_nickname    varchar(20)  NOT NULL,
  user_occupation  varchar(20)  NOT NULL DEFAULT '',
  tool_name        varchar(50)  NOT NULL DEFAULT '',
  rating           integer      NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  content          text         NOT NULL DEFAULT '',
  email            varchar(200) NOT NULL DEFAULT '',
  submit_ip        varchar(100) NOT NULL DEFAULT '',
  status           varchar(20)  NOT NULL DEFAULT 'pending',
  reject_reason    text         NOT NULL DEFAULT '',
  images           text[]       DEFAULT ARRAY[]::text[],
  weibo            varchar(100) NOT NULL DEFAULT '',
  xiaohongshu      varchar(100) NOT NULL DEFAULT '',
  bilibili         varchar(100) NOT NULL DEFAULT '',
  douyin           varchar(100) NOT NULL DEFAULT '',
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read approved reviews" ON reviews;
CREATE POLICY "Public read approved reviews" ON reviews FOR SELECT USING (status = 'approved');
DROP POLICY IF EXISTS "Anon full access reviews" ON reviews;
CREATE POLICY "Anon full access reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);

-- 测试评测数据（已通过审核）
INSERT INTO reviews (user_nickname, user_occupation, tool_name, rating, content, status) VALUES
  ('张律师',   '律师',  '法查查AI',      5, '合同审查效率提升10倍，错误率几乎为0，强烈推荐给同行。以前审一份合同要花半天，现在3分钟就能出意见书，覆盖的法律场景非常全面。', 'approved'),
  ('李设计师', '设计师', 'DesignAI Pro', 5, '生成的海报初稿质量很高，商用授权也很方便，省了很多时间。帮我把海报设计效率提升了至少3倍，模板质量很高，已经推荐给整个设计团队了。', 'approved'),
  ('王会计',   '会计',  '财税智能助手',  5, '自动识别发票功能太香了，再也不用手动录入几百张发票了。自动记账报税、智能票据识别，发票识别准确率99%，会计必备神器。', 'approved')
ON CONFLICT DO NOTHING;

-- ── 完成 ─────────────────────────────────────────────────────
-- 运行完成后，在 Supabase 控制台 Table Editor 中可验证数据
