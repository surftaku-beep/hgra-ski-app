-- ============================================================
-- 大会登録フォームの変更に伴うDBスキーマ更新
--
-- 1. tournaments に大会URL用カラムを追加
-- 2. tournament_days テーブルを新設(大会1件につき最大10日分、
--    各日にディシプリン(SG/GS/SL/PGS)と男女区分を持たせる)
--
-- 「対象カテゴリ」(age_category)はUIから削除したが、既存2件の大会に
-- 実データが入っているため、カラム自体はDBに残す(削除しない)。
--
-- 実行方法: Supabaseダッシュボード > SQL Editor に貼り付けて実行。
-- 冪等(何度実行しても安全)。
-- ============================================================

alter table public.tournaments add column if not exists tournament_url text;

create table if not exists public.tournament_days (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  day_index     integer not null check (day_index between 1 and 10),
  event_date    date,
  discipline    text check (discipline is null or discipline in ('SG', 'GS', 'SL', 'PGS')),
  gender        text check (gender is null or gender in ('Men', 'Woman')),
  created_at    timestamptz not null default now(),
  unique (tournament_id, day_index)
);

alter table public.tournament_days enable row level security;

drop policy if exists "coach_or_admin_all_tournament_days" on public.tournament_days;
create policy "coach_or_admin_all_tournament_days"
  on public.tournament_days
  for all
  to authenticated
  using (public.is_coach_or_admin())
  with check (public.is_coach_or_admin());

grant select, insert, update, delete on public.tournament_days to authenticated;

notify pgrst, 'reload schema';
