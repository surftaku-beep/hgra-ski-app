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

-- ---------------------------------------------------------
-- 8. news (公開サイト向けお知らせ記事)
-- ---------------------------------------------------------
create table if not exists public.news (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text not null unique,
  body             text,
  cover_image_url  text,
  is_published     boolean not null default false,
  published_at     timestamptz,
  author_id        uuid references public.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists news_published_idx
  on public.news (published_at desc)
  where is_published = true;

-- ---------------------------------------------------------
-- 9. personal_schedule (コーチ個人のスケジュール)
-- ---------------------------------------------------------
create table if not exists public.personal_schedule (
  id                     uuid primary key default gen_random_uuid(),
  coach_id               uuid not null references public.users (id) on delete cascade,
  title                  text not null,
  description            text,
  start_at               timestamptz not null,
  end_at                 timestamptz,
  related_tournament_id  uuid references public.tournaments (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists personal_schedule_coach_id_idx
  on public.personal_schedule (coach_id);
create index if not exists personal_schedule_start_at_idx
  on public.personal_schedule (start_at);

-- ---------------------------------------------------------
-- 10. team_profile (公開サイト向けチーム紹介。常に1行のみ)
--     固定の既知UUIDをidのデフォルト値かつ唯一許容される値とし、
--     2行目のINSERTをCHECK制約で拒否することでシングルトンを保証する
-- ---------------------------------------------------------
create table if not exists public.team_profile (
  id                    uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
  mission_statement     text,
  history               text,
  coaching_philosophy   text,
  training_info         text,
  price_info            text,
  coach_info            text,
  achievements_2021_22  text,
  address               text,
  google_maps_url       text,
  hero_image_url        text,
  updated_at            timestamptz not null default now()
);

-- 既存テーブルに対する追従(トップページのTRAINING/PRICE/COACH/実績/ACCESSセクション用)
alter table public.team_profile add column if not exists training_info         text;
alter table public.team_profile add column if not exists price_info            text;
alter table public.team_profile add column if not exists coach_info            text;
alter table public.team_profile add column if not exists achievements_2021_22  text;
alter table public.team_profile add column if not exists address               text;
alter table public.team_profile add column if not exists google_maps_url       text;
alter table public.team_profile add column if not exists hero_image_url        text;
alter table public.team_profile add column if not exists about_image_url       text;

alter table public.team_profile drop constraint if exists team_profile_singleton_check;
alter table public.team_profile add constraint team_profile_singleton_check
  check (id = '00000000-0000-0000-0000-000000000001'::uuid);

-- 唯一の行をシード(既にあれば何もしない)
insert into public.team_profile (id)
values ('00000000-0000-0000-0000-000000000001'::uuid)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 11. team_images (トップページのTRAINING/PRICE/COACH/実績セクション用の複数画像)
--     1枚ごとにキャプションを持てるよう、team_profileの配列列(*_image_urls)
--     から専用テーブルへ移行する。team_profileはシングルトンのため
--     team_profile_idのような外部キーは持たず、sectionで区分する。
-- ---------------------------------------------------------
create table if not exists public.team_images (
  id          uuid primary key default gen_random_uuid(),
  section     text not null check (section in ('training', 'price', 'coach', 'achievements')),
  image_url   text not null,
  caption     text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.team_images add column if not exists caption text;

-- 同じ画像URLの重複登録を防ぎ、移行INSERTのon conflictの対象にする
alter table public.team_images drop constraint if exists team_images_section_image_url_key;
alter table public.team_images add constraint team_images_section_image_url_key
  unique (section, image_url);

-- 旧: team_profileの配列列(*_image_urls)からteam_imagesへの一回限りの移行。
-- 列がまだ存在する場合のみ実行し、移行後に列を削除するため、
-- このファイルを何度再実行しても安全(2回目以降は列が無いため何もしない)。
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'team_profile'
      and column_name = 'training_image_urls'
  ) then
    insert into public.team_images (section, image_url, sort_order)
    select 'training', u.url, u.ord - 1
    from public.team_profile tp, unnest(tp.training_image_urls) with ordinality as u(url, ord)
    on conflict (section, image_url) do nothing;

    alter table public.team_profile drop column training_image_urls;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'team_profile'
      and column_name = 'price_image_urls'
  ) then
    insert into public.team_images (section, image_url, sort_order)
    select 'price', u.url, u.ord - 1
    from public.team_profile tp, unnest(tp.price_image_urls) with ordinality as u(url, ord)
    on conflict (section, image_url) do nothing;

    alter table public.team_profile drop column price_image_urls;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'team_profile'
      and column_name = 'coach_image_urls'
  ) then
    insert into public.team_images (section, image_url, sort_order)
    select 'coach', u.url, u.ord - 1
    from public.team_profile tp, unnest(tp.coach_image_urls) with ordinality as u(url, ord)
    on conflict (section, image_url) do nothing;

    alter table public.team_profile drop column coach_image_urls;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'team_profile'
      and column_name = 'achievements_image_urls'
  ) then
    insert into public.team_images (section, image_url, sort_order)
    select 'achievements', u.url, u.ord - 1
    from public.team_profile tp, unnest(tp.achievements_image_urls) with ordinality as u(url, ord)
    on conflict (section, image_url) do nothing;

    alter table public.team_profile drop column achievements_image_urls;
  end if;
end $$;

-- updated_at を更新時に自動でセットするトリガー(news / personal_schedule / team_profile 共通)
drop trigger if exists news_set_updated_at on public.news;
create trigger news_set_updated_at
  before update on public.news
  for each row
  execute function public.set_updated_at();

drop trigger if exists personal_schedule_set_updated_at on public.personal_schedule;
create trigger personal_schedule_set_updated_at
  before update on public.personal_schedule
  for each row
  execute function public.set_updated_at();

drop trigger if exists team_profile_set_updated_at on public.team_profile;
create trigger team_profile_set_updated_at
  before update on public.team_profile
  for each row
  execute function public.set_updated_at();

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
-- 「呼び出し元はadminロールか」判定用ヘルパー関数
-- ユーザーの新規作成(INSERT)・権限変更(UPDATE)など、
-- coachには許可しない操作の判定に使う。
-- =========================================================
create or replace function public.is_admin()
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
      and u.role = 'admin'
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
alter table public.users              enable row level security;
alter table public.athletes           enable row level security;
alter table public.race_results       enable row level security;
alter table public.evaluations        enable row level security;
alter table public.guardians          enable row level security;
alter table public.tournaments        enable row level security;
alter table public.tournament_entries enable row level security;
alter table public.news               enable row level security;
alter table public.personal_schedule  enable row level security;
alter table public.team_profile       enable row level security;
alter table public.team_images        enable row level security;

-- =========================================================
-- ポリシー定義
-- coach または admin のみ SELECT / INSERT / UPDATE / DELETE 可
-- =========================================================

-- --- users ---
-- 閲覧はcoach/admin。ユーザーの新規作成(招待)・権限変更・削除はadminのみに限定する
-- (coachが自分でユーザーを作成したり他人のroleを書き換えたりできないようにするため)
drop policy if exists "coach_or_admin_all_users" on public.users;

drop policy if exists "coach_or_admin_select_users" on public.users;
create policy "coach_or_admin_select_users"
  on public.users
  for select
  to authenticated
  using (public.is_coach_or_admin());

drop policy if exists "admin_insert_users" on public.users;
create policy "admin_insert_users"
  on public.users
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admin_update_users" on public.users;
create policy "admin_update_users"
  on public.users
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin_delete_users" on public.users;
create policy "admin_delete_users"
  on public.users
  for delete
  to authenticated
  using (public.is_admin());

-- --- athletes ---
drop policy if exists "coach_or_admin_all_athletes" on public.athletes;
create policy "coach_or_admin_all_athletes"
  on public.athletes
  for all
  to authenticated
  using (public.is_coach_or_admin())
  with check (public.is_coach_or_admin());

-- --- race_results ---
-- coach/adminは全件操作可能。選手本人は自分の競技記録を閲覧のみ可能
-- (保護者はathlete-guardianの紐付けが未実装のため対象外)
drop policy if exists "coach_or_admin_all_race_results" on public.race_results;
create policy "coach_or_admin_all_race_results"
  on public.race_results
  for all
  to authenticated
  using (public.is_coach_or_admin())
  with check (public.is_coach_or_admin());

drop policy if exists "athlete_view_own_race_results" on public.race_results;
create policy "athlete_view_own_race_results"
  on public.race_results
  for select
  to authenticated
  using (public.is_own_athlete(athlete_id));

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
-- coach/adminは全件操作可能。選手本人は自分のエントリー行(entry_type='athlete')のみ閲覧可能
drop policy if exists "coach_or_admin_all_tournament_entries" on public.tournament_entries;
create policy "coach_or_admin_all_tournament_entries"
  on public.tournament_entries
  for all
  to authenticated
  using (public.is_coach_or_admin())
  with check (public.is_coach_or_admin());

drop policy if exists "athlete_view_own_tournament_entries" on public.tournament_entries;
create policy "athlete_view_own_tournament_entries"
  on public.tournament_entries
  for select
  to authenticated
  using (entry_type = 'athlete' and public.is_own_athlete(athlete_id));

-- --- news ---
-- coach/adminは下書きを含む全件のSELECT/INSERT/UPDATE/DELETEが可能
drop policy if exists "coach_or_admin_all_news" on public.news;
create policy "coach_or_admin_all_news"
  on public.news
  for all
  to authenticated
  using (public.is_coach_or_admin())
  with check (public.is_coach_or_admin());

-- 公開済み記事(is_published = true)は未ログイン(anon)含め誰でも閲覧可能
drop policy if exists "public_view_published_news" on public.news;
create policy "public_view_published_news"
  on public.news
  for select
  to anon, authenticated
  using (is_published = true);

-- --- personal_schedule ---
-- 「閲覧は共有・書き込みは本人のみ」はFOR ALLの1ポリシーでは表現できないため
-- SELECT/INSERT/UPDATE/DELETEを個別ポリシーに分ける。
-- users.role は athlete/guardian も許容するため、全ポリシーで
-- is_coach_or_admin() を必須条件にしてcoach/admin以外を完全に締め出す。

-- 閲覧: coach/adminなら誰でも全員分のスケジュールを閲覧可能(チームで共有)
drop policy if exists "coach_or_admin_select_personal_schedule" on public.personal_schedule;
create policy "coach_or_admin_select_personal_schedule"
  on public.personal_schedule
  for select
  to authenticated
  using (public.is_coach_or_admin());

-- 作成: 自分自身(coach_id = auth.uid())の行のみ作成可能
drop policy if exists "own_insert_personal_schedule" on public.personal_schedule;
create policy "own_insert_personal_schedule"
  on public.personal_schedule
  for insert
  to authenticated
  with check (public.is_coach_or_admin() and coach_id = auth.uid());

-- 更新: 自分自身の行のみ更新可能
drop policy if exists "own_update_personal_schedule" on public.personal_schedule;
create policy "own_update_personal_schedule"
  on public.personal_schedule
  for update
  to authenticated
  using (public.is_coach_or_admin() and coach_id = auth.uid())
  with check (public.is_coach_or_admin() and coach_id = auth.uid());

-- 削除: 自分自身の行のみ削除可能
drop policy if exists "own_delete_personal_schedule" on public.personal_schedule;
create policy "own_delete_personal_schedule"
  on public.personal_schedule
  for delete
  to authenticated
  using (public.is_coach_or_admin() and coach_id = auth.uid());

-- --- team_profile ---
-- 閲覧: anon含め誰でも常に閲覧可能(下書き概念なし)
drop policy if exists "public_view_team_profile" on public.team_profile;
create policy "public_view_team_profile"
  on public.team_profile
  for select
  to anon, authenticated
  using (true);

-- 更新: coach/adminのみ。INSERT/DELETEポリシーは意図的に定義しない
-- (このテーブルの行はマイグレーションでのみ作成・削除される)
drop policy if exists "coach_or_admin_update_team_profile" on public.team_profile;
create policy "coach_or_admin_update_team_profile"
  on public.team_profile
  for update
  to authenticated
  using (public.is_coach_or_admin())
  with check (public.is_coach_or_admin());

-- --- team_images ---
-- 閲覧: anon含め誰でも常に閲覧可能
drop policy if exists "public_view_team_images" on public.team_images;
create policy "public_view_team_images"
  on public.team_images
  for select
  to anon, authenticated
  using (true);

-- 追加・更新・削除: coach/adminのみ
drop policy if exists "coach_or_admin_all_team_images" on public.team_images;
create policy "coach_or_admin_all_team_images"
  on public.team_images
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
grant select, insert, update, delete on public.news               to authenticated;
grant select, insert, update, delete on public.personal_schedule  to authenticated;
grant select, update                 on public.team_profile       to authenticated;
grant select, insert, update, delete on public.team_images        to authenticated;

grant execute on function public.is_coach_or_admin() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_coach_directory() to authenticated;
grant execute on function public.is_own_athlete(uuid) to authenticated;

-- =========================================================
-- anon(未ログイン)ロールへの限定的な権限付与
-- このプロジェクトで初めて公開サイト向けに読み取りを許可するテーブル群。
-- insert/update/deleteは一切付与しない(APIからの書き込みを完全に禁止)。
-- =========================================================
grant usage on schema public to anon;

grant select on public.news         to anon;
grant select on public.team_profile to anon;
grant select on public.team_images  to anon;

-- =========================================================
-- Supabase Storage: team-assets バケット
-- チーム紹介ページのヒーロー画像などをアップロードするための
-- 公開バケット。読み取りは誰でも可、書き込みはcoach/adminのみ。
-- =========================================================
insert into storage.buckets (id, name, public)
values ('team-assets', 'team-assets', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public_view_team_assets" on storage.objects;
create policy "public_view_team_assets"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'team-assets');

drop policy if exists "coach_or_admin_upload_team_assets" on storage.objects;
create policy "coach_or_admin_upload_team_assets"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'team-assets' and public.is_coach_or_admin());

drop policy if exists "coach_or_admin_update_team_assets" on storage.objects;
create policy "coach_or_admin_update_team_assets"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'team-assets' and public.is_coach_or_admin())
  with check (bucket_id = 'team-assets' and public.is_coach_or_admin());

drop policy if exists "coach_or_admin_delete_team_assets" on storage.objects;
create policy "coach_or_admin_delete_team_assets"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'team-assets' and public.is_coach_or_admin());

-- =========================================================
-- PostgRESTのスキーマキャッシュを強制的にリロードする
-- (新しいテーブル/関数がすぐにAPIから見えるようにするため)
-- =========================================================
notify pgrst, 'reload schema';
