begin;

drop policy if exists "service_role_all_users" on public.users;
drop policy if exists "service_role_all_metrics" on public.metrics_snapshots;
drop policy if exists "service_role_all_playlists" on public.playlist_snapshots;
drop policy if exists "service_role_all_alerts" on public.alerts_config;
drop policy if exists "service_role_all_global_trends" on public.global_trends;

alter table public.users enable row level security;
alter table public.metrics_snapshots enable row level security;
alter table public.playlist_snapshots enable row level security;
alter table public.alerts_config enable row level security;
alter table public.global_trends enable row level security;

revoke all privileges on table
  public.users,
  public.metrics_snapshots,
  public.playlist_snapshots,
  public.alerts_config,
  public.global_trends
from public, anon, authenticated;

revoke all privileges on all sequences in schema public
from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

grant all privileges on table
  public.users,
  public.metrics_snapshots,
  public.playlist_snapshots,
  public.alerts_config,
  public.global_trends
to service_role;

grant all privileges on all sequences in schema public to service_role;

commit;

