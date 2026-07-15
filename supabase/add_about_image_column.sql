-- ============================================================
-- team_profile に「チームについて」セクション専用の画像カラムを追加
--
-- 背景: ヒーロー画像(hero_image_url)を「チームについて」セクションでも
-- 流用していたため、管理画面でどちらか一方を差し替えると両方の表示が
-- 変わってしまっていた。両セクションを独立して管理できるよう、
-- 専用カラム about_image_url を追加する。
--
-- 実行方法: Supabaseダッシュボード > SQL Editor に貼り付けて実行。
-- 冪等(何度実行しても安全)。
-- ============================================================

alter table public.team_profile add column if not exists about_image_url text;

notify pgrst, 'reload schema';
