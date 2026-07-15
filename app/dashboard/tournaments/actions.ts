"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { TOURNAMENT_MAX_DAYS } from "@/app/dashboard/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type TournamentFormState = {
  error?: string;
  success?: boolean;
};

function normalizeOptional(value: FormDataEntryValue | null) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

// Select系フィールドは「未設定」を選ぶとこの値が送られてくるためnullに変換する
function normalizeSelect(value: FormDataEntryValue | null) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed || trimmed === "unset") {
    return null;
  }
  return trimmed;
}

// day_1_date/day_1_discipline/day_1_gender ... day_10_* から、
// 日付と競技(discipline)の両方が入力された行だけをtournament_daysへの
// 保存用データに変換する。競技が「未設定」のままの行は、ユーザーが
// 意図せず空の行を送ってしまったものとみなして除外する(男女は任意のまま)。
function buildTournamentDays(formData: FormData, tournamentId: string) {
  const days: {
    tournament_id: string;
    day_index: number;
    event_date: string;
    discipline: string;
    gender: string | null;
  }[] = [];

  for (let dayNumber = 1; dayNumber <= TOURNAMENT_MAX_DAYS; dayNumber++) {
    const eventDate = normalizeOptional(formData.get(`day_${dayNumber}_date`));
    const discipline = normalizeSelect(formData.get(`day_${dayNumber}_discipline`));
    if (!eventDate || !discipline) continue;

    days.push({
      tournament_id: tournamentId,
      day_index: dayNumber,
      event_date: eventDate,
      discipline,
      gender: normalizeSelect(formData.get(`day_${dayNumber}_gender`)),
    });
  }

  return days;
}

async function saveTournamentDays(
  supabase: SupabaseServerClient,
  tournamentId: string,
  formData: FormData,
) {
  // 差分更新ではなく、常に全件入れ替える(最大10行なのでコストは無視できる)
  const { error: deleteError } = await supabase
    .from("tournament_days")
    .delete()
    .eq("tournament_id", tournamentId);

  if (deleteError) {
    return `日程の保存に失敗しました: ${deleteError.message}`;
  }

  const days = buildTournamentDays(formData, tournamentId);
  if (days.length === 0) {
    return null;
  }

  const { error: insertError } = await supabase
    .from("tournament_days")
    .insert(days);

  if (insertError) {
    return `日程の保存に失敗しました: ${insertError.message}`;
  }

  return null;
}

export async function createTournament(
  _prevState: TournamentFormState,
  formData: FormData,
): Promise<TournamentFormState> {
  const name = normalizeOptional(formData.get("name"));
  const startDate = normalizeOptional(formData.get("start_date"));

  if (!name || !startDate) {
    return { error: "大会名・開始日は必須です。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      name,
      start_date: startDate,
      end_date: normalizeOptional(formData.get("end_date")),
      location: normalizeOptional(formData.get("location")),
      description: normalizeOptional(formData.get("description")),
      grade: normalizeSelect(formData.get("grade")),
      tournament_url: normalizeOptional(formData.get("tournament_url")),
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createTournament] failed:", error);
    return { error: `登録に失敗しました: ${error?.message ?? "不明なエラー"}` };
  }

  const daysError = await saveTournamentDays(supabase, data.id, formData);
  if (daysError) {
    console.error("[createTournament] tournament_days failed:", daysError);
    return { error: daysError };
  }

  revalidatePath("/dashboard/tournaments");
  return { success: true };
}

export async function updateTournament(
  _prevState: TournamentFormState,
  formData: FormData,
): Promise<TournamentFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "更新対象が特定できませんでした。" };
  }

  const name = normalizeOptional(formData.get("name"));
  const startDate = normalizeOptional(formData.get("start_date"));

  if (!name || !startDate) {
    return { error: "大会名・開始日は必須です。" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tournaments")
    .update({
      name,
      start_date: startDate,
      end_date: normalizeOptional(formData.get("end_date")),
      location: normalizeOptional(formData.get("location")),
      description: normalizeOptional(formData.get("description")),
      grade: normalizeSelect(formData.get("grade")),
      tournament_url: normalizeOptional(formData.get("tournament_url")),
    })
    .eq("id", id);

  if (error) {
    console.error("[updateTournament] failed:", error);
    return { error: `更新に失敗しました: ${error.message}` };
  }

  const daysError = await saveTournamentDays(supabase, id, formData);
  if (daysError) {
    console.error("[updateTournament] tournament_days failed:", daysError);
    return { error: daysError };
  }

  revalidatePath("/dashboard/tournaments");
  revalidatePath(`/dashboard/tournaments/${id}`);
  return { success: true };
}

export async function deleteTournament(
  id: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("tournaments").delete().eq("id", id);

  if (error) {
    console.error("[deleteTournament] failed:", error);
    return { error: `削除に失敗しました: ${error.message}` };
  }

  revalidatePath("/dashboard/tournaments");
  return {};
}
