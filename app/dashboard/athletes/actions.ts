"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type AthleteFormState = {
  error?: string;
  success?: boolean;
};

function normalizeOptional(value: FormDataEntryValue | null) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function parseAthleteFormData(formData: FormData) {
  const birthYearRaw = formData.get("birth_year");
  const birthYear =
    typeof birthYearRaw === "string" && birthYearRaw.trim() !== ""
      ? Number(birthYearRaw)
      : null;

  return {
    name: typeof formData.get("name") === "string" ? (formData.get("name") as string).trim() : "",
    category: normalizeOptional(formData.get("category")),
    grade: normalizeOptional(formData.get("grade")),
    affiliation: normalizeOptional(formData.get("affiliation")),
    saj_id: normalizeOptional(formData.get("saj_id")),
    birth_year: birthYear !== null && !Number.isNaN(birthYear) ? birthYear : null,
  };
}

export async function createAthlete(
  _prevState: AthleteFormState,
  formData: FormData,
): Promise<AthleteFormState> {
  const values = parseAthleteFormData(formData);

  if (!values.name) {
    return { error: "氏名を入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("athletes").insert(values);

  if (error) {
    return { error: `登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/dashboard/athletes");
  return { success: true };
}

export async function updateAthlete(
  _prevState: AthleteFormState,
  formData: FormData,
): Promise<AthleteFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "更新対象の選手が特定できませんでした。" };
  }

  const values = parseAthleteFormData(formData);

  if (!values.name) {
    return { error: "氏名を入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("athletes").update(values).eq("id", id);

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/dashboard/athletes");
  return { success: true };
}

export async function deleteAthlete(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("athletes").delete().eq("id", id);

  if (error) {
    return { error: `削除に失敗しました: ${error.message}` };
  }

  revalidatePath("/dashboard/athletes");
  return {};
}
