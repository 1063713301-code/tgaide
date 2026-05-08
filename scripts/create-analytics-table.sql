-- 创建 analytics_events 表
create table if not exists public.analytics_events (
  id          uuid primary key default gen_random_uuid(),
  event_type  text not null,
  target_id   text,
  target_name text,
  profession  text,
  search_query text,
  created_at  timestamptz not null default now()
);

-- 索引（看板查询用）
create index if not exists analytics_events_event_type_idx on public.analytics_events (event_type);
create index if not exists analytics_events_created_at_idx  on public.analytics_events (created_at desc);
create index if not exists analytics_events_target_id_idx   on public.analytics_events (target_id);

-- RLS：开启行级安全
alter table public.analytics_events enable row level security;

-- 任何人可写（埋点）
create policy "anyone can insert events"
  on public.analytics_events for insert
  to anon, authenticated
  with check (true);

-- 任何人可读（后台已有 admin 登录保护，无需双重 RLS）
create policy "anyone can read events"
  on public.analytics_events for select
  to anon, authenticated
  using (true);
