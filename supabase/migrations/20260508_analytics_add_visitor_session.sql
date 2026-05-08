alter table analytics_events add column if not exists visitor_id text;
alter table analytics_events add column if not exists session_id text;

create index if not exists analytics_visitor_idx on analytics_events (visitor_id);
create index if not exists analytics_session_idx on analytics_events (session_id);
