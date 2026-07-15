-- ============================================================
-- team_images テーブル修復用スクリプト
--
-- 背景: 本番Supabaseプロジェクトに対して setup_coach.sql の
-- team_images 関連部分(テーブル作成・RLS・権限付与)が未実行だった
-- ため、PostgRESTのスキーマキャッシュに存在せず
-- 「Could not find the table 'public.team_images' in the schema
-- cache」(PGRST205) が発生していた。
--
-- 実行方法: Supabaseダッシュボード > SQL Editor に貼り付けて実行。
-- 冪等(何度実行しても安全)。
-- ============================================================

create table if not exists public.team_images (
  id          uuid primary key default gen_random_uuid(),
  section     text not null check (section in ('training', 'price', 'coach', 'achievements')),
  image_url   text not null,
  caption     text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.team_images add column if not exists caption text;

alter table public.team_images drop constraint if exists team_images_section_image_url_key;
alter table public.team_images add constraint team_images_section_image_url_key
  unique (section, image_url);

alter table public.team_images enable row level security;

drop policy if exists "public_view_team_images" on public.team_images;
create policy "public_view_team_images"
  on public.team_images
  for select
  to anon, authenticated
  using (true);

drop policy if exists "coach_or_admin_all_team_images" on public.team_images;
create policy "coach_or_admin_all_team_images"
  on public.team_images
  for all
  to authenticated
  using (public.is_coach_or_admin())
  with check (public.is_coach_or_admin());

grant select, insert, update, delete on public.team_images to authenticated;
grant select on public.team_images to anon;

-- PostgRESTにスキーマキャッシュの再読み込みを即座に指示する。
-- Supabase管理下のPostgRESTはこのNOTIFYをリッスンしており、
-- 通常は数秒以内にキャッシュへ反映される。
notify pgrst, 'reload schema';
