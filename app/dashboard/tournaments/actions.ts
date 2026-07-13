"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

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
  const { error } = await supabase.from("tournaments").insert({
    name,
    start_date: startDate,
    end_date: normalizeOptional(formData.get("end_date")),
    location: normalizeOptional(formData.get("location")),
    description: normalizeOptional(formData.get("description")),
    grade: normalizeSelect(formData.get("grade")),
    age_category: normalizeSelect(formData.get("age_category")),
  });

  if (error) {
    console.error("[createTournament] failed:", error);
    return { error: `登録に失敗しました: ${error.message}` };
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
      age_category: normalizeSelect(formData.get("age_category")),
    })
    .eq("id", id);

  if (error) {
    console.error("[updateTournament] failed:", error);
    return { error: `更新に失敗しました: ${error.message}` };
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
