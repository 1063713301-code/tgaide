-- 在 Supabase SQL Editor 执行此文件
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text,
  created_at timestamptz default now()
);

-- 开启 RLS，只允许 anon 读取（用于 Edge Function 验证）
alter table api_keys enable row level security;
create policy "allow anon read" on api_keys for select using (true);

-- 插入一个测试 Key（可自行修改）
insert into api_keys (key, name) values ('tgaide-test-key-2026', '测试Key');
