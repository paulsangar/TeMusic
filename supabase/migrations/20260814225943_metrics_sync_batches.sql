alter table public.metrics_snapshots
  add column if not exists sync_batch_id uuid;

create index if not exists idx_metrics_snapshots_sync_batch
  on public.metrics_snapshots (user_id, sync_batch_id, time_range);
