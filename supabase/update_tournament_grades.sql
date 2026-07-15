-- ============================================================
-- tournaments.grade の許容値を更新
-- 旧: 'FIS', 'SAJ A級', 'SAJ B級'
-- 新: 'FIS', 'A', 'A(YH)', 'B', 'B(YT)'
--
-- 実行前に確認したところ、既存データのgradeは null または 'FIS' のみで、
-- 旧SAJ表記のデータは存在しないため、そのまま制約を差し替えて問題ない。
--
-- 実行方法: Supabaseダッシュボード > SQL Editor に貼り付けて実行。
-- 冪等(何度実行しても安全)。
-- ============================================================

alter table public.tournaments drop constraint if exists tournaments_grade_check;
alter table public.tournaments add constraint tournaments_grade_check check (
  grade is null or grade in ('FIS', 'A', 'A(YH)', 'B', 'B(YT)')
);

notify pgrst, 'reload schema';
