-- =========================================================
-- スキーチーム コーチ専用システム DBセットアップ
-- テーブル: users / athletes / race_results / evaluations
-- 方針: coach または admin ロールを持つユーザーのみ
--       全テーブルに対して SELECT / INSERT / UPDATE / DELETE 可能
-- =========================================================

-- gen_random_uuid() を使うため pgcrypto を有効化
-- (Supabaseプロジェクトでは通常デフォルトで有効)
create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- 1. users (auth.users と1:1で連携するプロフィールテーブル)
-- ---------------------------------------------------------
create table if not exists public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       text not null check (role in ('admin', 'coach')),
  email      text,
  created_at timestamptz not null default now()
);

-- 既存プロジェクトでこのスクリプトを再実行した場合に備え、
-- 新規カラムを個別にも追加できるようにしておく(冪等)
alter table public.users add column if not exists email text;

-- 選手・保護者向けログインポータルのために role の許容値を拡張する。
-- (CHECK制約は "ADD CONSTRAINT IF NOT EXISTS" が使えないため、DROP → ADD で冪等に定義し直す)
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check check (
  role in ('admin', 'coach', 'athlete', 'guardian')
);

-- 既存ユーザーのemailをauth.usersから一括バックフィル(nullの行のみ)
update public.users u
set email = au.email
from auth.users au
where au.id = u.id
  and u.email is null;

-- ---------------------------------------------------------
-- 2. athletes (選手マスタ)
-- ---------------------------------------------------------
create table if not exists public.athletes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text,        -- クラス。例: 'K1', 'K2', 'HighSchool' など
  grade       text,        -- 学年。例: '高校2年'
  affiliation text,        -- 所属。例: '◯◯高校スキー部'
  saj_id      text,        -- SAJ ID
  birth_year  integer,
  created_at  timestamptz not null default now()
);

-- 既存プロジェクトでこのスクリプトを再実行した場合に備え、
-- 新規カラムを個別にも追加できるようにしておく(冪等)
alter table public.athletes add column if not exists grade text;
alter table public.athletes add column if not exists affiliation text;
alter table public.athletes add column if not exists saj_id text;

-- 選手本人のログインアカウント(auth.users)と選手マスタを紐付けるための列。
-- ログインしない選手も引き続き存在するためNULL許容。
alter table public.athletes add column if not exists user_id uuid references auth.users (id) on delete set null;

-- 1つのログインアカウントが複数の選手レコードに紐付かないようにする
create unique index if not exists athletes_user_id_key
  on public.athletes (user_id)
  where user_id is not null;

-- ---------------------------------------------------------
-- 3. race_results (SAJ大会成績)
--    将来的にSAJデータバンクのCSV一括インポートを想定した構成
-- ---------------------------------------------------------
create table if not exists public.race_results (
  id               uuid primary key default gen_random_uuid(),
  athlete_id       uuid not null references public.athletes (id) on delete cascade,
  tournament_date  date,
  tournament_name  text,
  discipline       text,   -- 例: 'SL', 'GS', 'SG', 'DH' など
  rank             integer,
  time             text,   -- '1:23.45' や 'DNF' 等の表記を許容するため text
  saj_points       numeric,
  created_at       timestamptz not null default now()
);

create index if not exists race_results_athlete_id_idx
  on public.race_results (athlete_id);

-- ---------------------------------------------------------
-- 4. evaluations (将来の方向性・育成方針)
-- ---------------------------------------------------------
create table if not exists public.evaluations (
  id               uuid primary key default gen_random_uuid(),
  athlete_id       uuid not null references public.athletes (id) on delete cascade,
  coach_id         uuid not null references public.users (id) on delete cascade,
  current_status   text,
  future_direction text,
  updated_at       timestamptz not null default now()
);

-- 選手1人につき育成・進学メモは1件に統一する(更新は上書き保存のため)
create unique index if not exists evaluations_athlete_id_key
  on public.evaluations (athlete_id);
create index if not exists evaluations_coach_id_idx
  on public.evaluations (coach_id);

-- updated_at を更新時に自動でセットするトリガー
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists evaluations_set_updated_at on public.evaluations;
create trigger evaluations_set_updated_at
  before update on public.evaluations
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------
-- 5. guardians (保護者・引率関係者マスタ。ログイン・認証は不要な連絡先データ)
-- ---------------------------------------------------------
create table if not exists public.guardians (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text,
  email      text,
  note       text,        -- 例: '◯◯選手の保護者'
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 6. tournaments (大会・遠征マスタ)
-- ---------------------------------------------------------
create table if not exists public.tournaments (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  start_date   date,
  end_date     date,
  location     text,
  description  text,        -- 大会の概要・メモ
  grade        text,        -- 'FIS', 'SAJ A級', 'SAJ B級'
  age_category text,        -- 'キッズ U8' など対象カテゴリ
  created_at   timestamptz not null default now()
);

-- 既存プロジェクトでこのスクリプトを再実行した場合に備え、
-- 新規カラムを個別にも追加できるようにしておく(冪等)。
-- 既存の大会データはこれらのカラムがNULLのままでもエラーにならない。
alter table public.tournaments add column if not exists description text;
alter table public.tournaments add column if not exists grade text;
alter table public.tournaments add column if not exists age_category text;

-- CHECK制約は "ADD CONSTRAINT IF NOT EXISTS" が使えないため、
-- DROP → ADD で冪等に定義し直す。NULLは許容する。
alter table public.tournaments drop constraint if exists tournaments_grade_check;
alter table public.tournaments add constraint tournaments_grade_check check (
  grade is null or grade in ('FIS', 'SAJ A級', 'SAJ B級')
);

alter table public.tournaments drop constraint if exists tournaments_age_category_check;
alter table public.tournaments add constraint tournaments_age_category_check check (
  age_category is null or age_category in (
    'キッズ U8', 'キッズ U10', 'ユース K1', 'ユース K2',
    'SAJ一般（少年）', 'SAJ一般（成年）', 'マスターズ'
  )
);

-- ---------------------------------------------------------
-- 7. tournament_entries (大会への選手参加・引率登録)
--    entry_type で「参加選手 / 引率保護者 / 引率コーチ」を区別し、
--    対応する *_id のみを設定する(他は null)
-- ---------------------------------------------------------
create table if not exists public.tournament_entries (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  entry_type    text not null check (
    entry_type in ('athlete', 'guardian_chaperone', 'coach_chaperone')
  ),
  athlete_id    uuid references public.athletes (id) on delete cascade,
  guardian_id   uuid references public.guardians (id) on delete cascade,
  coach_id      uuid references public.users (id) on delete cascade,
  created_at    timestamptz not null default now(),
  constraint tournament_entries_reference_check check (
    (entry_type = 'athlete'
      and athlete_id is not null and guardian_id is null and coach_id is null)
    or (entry_type = 'guardian_chaperone'
      and guardian_id is not null and athlete_id is null and coach_id is null)
    or (entry_type = 'coach_chaperone'
      and coach_id is not null and athlete_id is null and guardian_id is null)
  )
);

create index if not exists tournament_entries_tournament_id_idx
  on public.tournament_entries (tournament_id);

-- 同じ選手/保護者/コーチを同じ大会に重複登録できないようにする
create unique index if not exists tournament_entries_athlete_unique
  on public.tournament_entries (tournament_id, athlete_id)
  where entry_type = 'athlete';
create unique index if not exists tournament_entries_guardian_unique
  on public.tournament_entries (tournament_id, guardian_id)
  where entry_type = 'guardian_chaperone';
create unique index if not exists tournament_entries_coach_unique
  on public.tournament_entries (tournament_id, coach_id)
  where entry_type = 'coach_chaperone';

-- =========================================================
-- RLS判定用ヘルパー関数
-- SECURITY DEFINER で定義することで、users テーブル自体の
-- RLSポリシーからこの関数を呼んでも無限再帰にならない
-- (関数はテーブル所有者権限で実行され、RLSを経由しない)
-- =========================================================
create or replace function public.is_coach_or_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role in ('admin', 'coach')
  );
$$;

-- =========================================================
-- 「この選手は自分自身か」判定用ヘルパー関数
-- athletes.user_id = auth.uid() であれば本人とみなす。
-- SECURITY DEFINER にすることでathletesテーブルのRLS
-- (coach/adminのみ)を経由せず判定できるようにする。
-- =========================================================
create or replace function public.is_own_athlete(target_athlete_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.athletes a
    where a.id = target_athlete_id
      and a.user_id = auth.uid()
  );
$$;

-- =========================================================
-- コーチ一覧取得用関数
-- public.users には氏名を持たせない方針のため、引率者一覧などで
-- コーチを表示する際は auth.users のメールアドレスを使う。
-- auth.users は直接公開しないため、coach/admin のみ呼び出せる
-- SECURITY DEFINER 関数として限定的に公開する。
-- =========================================================
create or replace function public.get_coach_directory()
returns table (id uuid, email text, role text)
language sql
security definer
set search_path = public
stable
as $$
  select u.id, au.email, u.role
  from public.users u
  join auth.users au on au.id = u.id
  where public.is_coach_or_admin();
$$;

-- =========================================================
-- RLS有効化
-- =========================================================
alter table public.users             enable row level security;
alter table public.athletes          enable row level security;
alter table public.race_results      enable row level security;
alter table public.evaluations       enable row level security;
alter table public.guardians         enable row level security;
alter table public.tournaments       enable row level security;
alter table public.tournament_entries enable row level security;

-- =========================================================
-- ポリシー定義
-- coach または admin のみ SELECT / INSERT / UPDATE / DELETE 可
-- =========================================================

-- --- users ---
drop policy if exists "coach_or_admin_all_users" on public.users;
create policy "coach_or_admin_all_users"
  on public.users
  for all
  to authenticated
  using (public.is_coach_or_admin())
  with check (public.is_coach_or_admin());

-- --- athletes ---
drop policy if exists "coach_or_admin_all_athletes" on public.athletes;
create policy "coach_or_admin_all_athletes"
  on public.athletes
  for all
  to authenticated
  using (public.is_coach_or_admin())
  with check (public.is_coach_or_admin());

-- --- race_results ---
drop policy if exists "coach_or_admin_all_race_results" on public.race_results;
create policy "coach_or_admin_all_race_results"
  on public.race_results
  for all
  to authenticated
  using (public.is_coach_or_admin())
  with check (public.is_coach_or_admin());

-- --- evaluations ---
-- coach/adminは閲覧・編集とも全件可能。選手本人は自分の評価メモを閲覧のみ可能。
-- 保護者(guardian)にはどのポリシーも一致しないため、常にアクセス不可(0件)となる。
drop policy if exists "coach_or_admin_all_evaluations" on public.evaluations;
create policy "coach_or_admin_all_evaluations"
  on public.evaluations
  for all
  to authenticated
  using (public.is_coach_or_admin())
  with check (public.is_coach_or_admin());

drop policy if exists "athlete_view_own_evaluations" on public.evaluations;
create policy "athlete_view_own_evaluations"
  on public.evaluations
  for select
  to authenticated
  using (public.is_own_athlete(athlete_id));

-- --- guardians ---
drop policy if exists "coach_or_admin_all_guardians" on public.guardians;
create policy "coach_or_admin_all_guardians"
  on public.guardians
  for all
  to authenticated
  using (public.is_coach_or_admin())
  with check (public.is_coach_or_admin());

-- --- tournaments ---
drop policy if exists "coach_or_admin_all_tournaments" on public.tournaments;
create policy "coach_or_admin_all_tournaments"
  on public.tournaments
  for all
  to authenticated
  using (public.is_coach_or_admin())
  with check (public.is_coach_or_admin());

-- --- tournament_entries ---
drop policy if exists "coach_or_admin_all_tournament_entries" on public.tournament_entries;
create policy "coach_or_admin_all_tournament_entries"
  on public.tournament_entries
  for all
  to authenticated
  using (public.is_coach_or_admin())
  with check (public.is_coach_or_admin());

-- =========================================================
-- 権限付与
-- PostgRESTからテーブルへアクセスできるようにする
-- (実際のアクセス制御は上記RLSポリシーが担う)
-- =========================================================
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.users              to authenticated;
grant select, insert, update, delete on public.athletes           to authenticated;
grant select, insert, update, delete on public.race_results       to authenticated;
grant select, insert, update, delete on public.evaluations        to authenticated;
grant select, insert, update, delete on public.guardians          to authenticated;
grant select, insert, update, delete on public.tournaments        to authenticated;
grant select, insert, update, delete on public.tournament_entries to authenticated;

grant execute on function public.is_coach_or_admin() to authenticated;
grant execute on function public.get_coach_directory() to authenticated;
grant execute on function public.is_own_athlete(uuid) to authenticated;

-- =========================================================
-- PostgRESTのスキーマキャッシュを強制的にリロードする
-- (新しいテーブル/関数がすぐにAPIから見えるようにするため)
-- =========================================================
notify pgrst, 'reload schema';
