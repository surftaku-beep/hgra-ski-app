"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type RaceResultFormState = {
  error?: string;
  success?: boolean;
};

export type BulkInsertRow = {
  tournament_date: string;
  tournament_name: string;
  discipline: string | null;
  rank: number | null;
  saj_points: number | null;
};

export type BulkInsertState = {
  error?: string;
  success?: boolean;
  insertedCount?: number;
};

export type EvaluationFormState = {
  error?: string;
  success?: boolean;
};

function normalizeOptional(value: FormDataEntryValue | null) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseSingleRaceResultForm(formData: FormData) {
  const tournamentName = normalizeOptional(formData.get("tournament_name"));
  const tournamentDate = normalizeOptional(formData.get("tournament_date"));
  const discipline = normalizeOptional(formData.get("discipline"));

  if (!tournamentName || !tournamentDate || !discipline) {
    return { error: "大会名・日付・種目は必須です。" } as const;
  }

  return {
    values: {
      tournament_name: tournamentName,
      tournament_date: tournamentDate,
      discipline,
      rank: parseOptionalNumber(formData.get("rank")),
      time: normalizeOptional(formData.get("time")),
      saj_points: parseOptionalNumber(formData.get("saj_points")),
    },
  } as const;
}

export async function createRaceResult(
  _prevState: RaceResultFormState,
  formData: FormData,
): Promise<RaceResultFormState> {
  const athleteId = formData.get("athlete_id");
  if (typeof athleteId !== "string" || !athleteId) {
    return { error: "選手が特定できませんでした。" };
  }

  const parsed = parseSingleRaceResultForm(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("race_results")
    .insert({ athlete_id: athleteId, ...parsed.values });

  if (error) {
    return { error: `登録に失敗しました: ${error.message}` };
  }

  revalidatePath(`/dashboard/athletes/${athleteId}`);
  return { success: true };
}

export async function updateRaceResult(
  _prevState: RaceResultFormState,
  formData: FormData,
): Promise<RaceResultFormState> {
  const id = formData.get("id");
  const athleteId = formData.get("athlete_id");
  if (typeof id !== "string" || !id) {
    return { error: "更新対象の成績が特定できませんでした。" };
  }
  if (typeof athleteId !== "string" || !athleteId) {
    return { error: "選手が特定できませんでした。" };
  }

  const parsed = parseSingleRaceResultForm(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("race_results")
    .update(parsed.values)
    .eq("id", id);

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath(`/dashboard/athletes/${athleteId}`);
  return { success: true };
}

export async function deleteRaceResult(
  id: string,
  athleteId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("race_results").delete().eq("id", id);

  if (error) {
    return { error: `削除に失敗しました: ${error.message}` };
  }

  revalidatePath(`/dashboard/athletes/${athleteId}`);
  return {};
}

export async function bulkInsertRaceResults(
  _prevState: BulkInsertState,
  payload: { athleteId: string; rows: BulkInsertRow[] },
): Promise<BulkInsertState> {
  const { athleteId, rows } = payload;

  if (!athleteId) {
    return { error: "選手が特定できませんでした。" };
  }

  const validRows = rows.filter(
    (row) => row.tournament_date && row.tournament_name,
  );

  if (validRows.length === 0) {
    return { error: "登録する行がありません。プレビューで選択してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("race_results").insert(
    validRows.map((row) => ({
      athlete_id: athleteId,
      tournament_date: row.tournament_date,
      tournament_name: row.tournament_name,
      discipline: row.discipline,
      rank: row.rank,
      saj_points: row.saj_points,
    })),
  );

  if (error) {
    return { error: `登録に失敗しました: ${error.message}` };
  }

  revalidatePath(`/dashboard/athletes/${athleteId}`);
  return { success: true, insertedCount: validRows.length };
}

export async function saveEvaluation(
  _prevState: EvaluationFormState,
  formData: FormData,
): Promise<EvaluationFormState> {
  const athleteId = formData.get("athlete_id");
  if (typeof athleteId !== "string" || !athleteId) {
    return { error: "選手が特定できませんでした。" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログイン状態を確認できませんでした。" };
  }

  const { error } = await supabase.from("evaluations").upsert(
    {
      athlete_id: athleteId,
      coach_id: user.id,
      current_status: normalizeOptional(formData.get("current_status")),
      future_direction: normalizeOptional(formData.get("future_direction")),
    },
    { onConflict: "athlete_id" },
  );

  if (error) {
    return { error: `保存に失敗しました: ${error.message}` };
  }

  revalidatePath(`/dashboard/athletes/${athleteId}`);
  return { success: true };
}
