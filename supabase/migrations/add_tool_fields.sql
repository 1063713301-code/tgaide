ALTER TABLE tools
ADD COLUMN short_tag text,
ADD COLUMN full_desc text,
ADD COLUMN highlights text[] DEFAULT '{}',
ADD COLUMN drawbacks text[] DEFAULT '{}',
ADD COLUMN tg_advice text,
ADD COLUMN tags text[] DEFAULT '{}',
ADD COLUMN slug text UNIQUE;

CREATE INDEX idx_tools_slug ON tools(slug);
