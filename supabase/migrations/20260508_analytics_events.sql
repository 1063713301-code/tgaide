create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  target_id text,
  target_name text,
  profession text,
  search_query text,
  created_at timestamptz not null default now()
);

-- 允许匿名写入（前端埋点用 anon key）
alter table analytics_events enable row level security;

create policy "allow anon insert" on analytics_events
  for insert to anon with check (true);

-- service_role 可读
create policy "allow service read" on analytics_events
  for select to service_role using (true);

-- anon 也可读（数据看板前端查询用）
create policy "allow anon select" on analytics_events
  for select to anon using (true);

-- 加速查询的索引
create index on analytics_events (event_type, created_at desc);
create index on analytics_events (created_at desc);
