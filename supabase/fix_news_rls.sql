-- ============================================================
-- news テーブル RLS/権限 修復用スクリプト
--
-- 診断結果: service_role キーで news を確認すると is_published=true
-- の記事が1件存在するが、anon キー(公開サイトが実際に使う権限)で
-- 同じテーブルを問い合わせると常に空配列が返る(エラーにはならず
-- HTTP 200 + [])。これはGRANTが無い場合に出る権限エラーではなく、
-- 「RLSは有効だが anon ロールに一致するSELECTポリシーが存在しない」
-- 場合の典型的な挙動。
--
-- つまり原因はアプリのコード側(app/news/page.tsx, app/page.tsx)ではなく、
-- setup_coach.sql の news 用ポリシーが本番DBに反映されていないこと。
-- (team_images のときと同様、スクリプトの一部だけが未実行だった)
--
-- 実行方法: Supabaseダッシュボード > SQL Editor に貼り付けて実行。
-- 冪等(何度実行しても安全)。
-- ============================================================

alter table public.news enable row level security;

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

grant select, insert, update, delete on public.news to authenticated;
grant select on public.news to anon;

notify pgrst, 'reload schema';
