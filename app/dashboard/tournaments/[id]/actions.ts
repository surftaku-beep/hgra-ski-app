"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { EntryType } from "@/app/dashboard/types";

export type TournamentEntryFormState = {
  error?: string;
  success?: boolean;
};

const ENTRY_TYPES: EntryType[] = [
  "athlete",
  "guardian_chaperone",
  "coach_chaperone",
];

export async function addTournamentEntry(
  _prevState: TournamentEntryFormState,
  formData: FormData,
): Promise<TournamentEntryFormState> {
  const tournamentId = formData.get("tournament_id");
  const entryType = formData.get("entry_type");
  const entityId = formData.get("entity_id");

  if (typeof tournamentId !== "string" || !tournamentId) {
    return { error: "大会が特定できませんでした。" };
  }
  if (
    typeof entryType !== "string" ||
    !ENTRY_TYPES.includes(entryType as EntryType)
  ) {
    return { error: "登録種別が不正です。" };
  }
  if (typeof entityId !== "string" || !entityId) {
    return { error: "選択してください。" };
  }

  const row: {
    tournament_id: string;
    entry_type: string;
    athlete_id?: string;
    guardian_id?: string;
    coach_id?: string;
  } = { tournament_id: tournamentId, entry_type: entryType };

  if (entryType === "athlete") row.athlete_id = entityId;
  if (entryType === "guardian_chaperone") row.guardian_id = entityId;
  if (entryType === "coach_chaperone") row.coach_id = entityId;

  const supabase = await createClient();
  const { error } = await supabase.from("tournament_entries").insert(row);

  if (error) {
    if (error.code === "23505") {
      return { error: "すでに追加されています。" };
    }
    return { error: `追加に失敗しました: ${error.message}` };
  }

  revalidatePath(`/dashboard/tournaments/${tournamentId}`);
  return { success: true };
}

export async function removeTournamentEntry(
  entryId: string,
  tournamentId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tournament_entries")
    .delete()
    .eq("id", entryId);

  if (error) {
    return { error: `削除に失敗しました: ${error.message}` };
  }

  revalidatePath(`/dashboard/tournaments/${tournamentId}`);
  return {};
}
