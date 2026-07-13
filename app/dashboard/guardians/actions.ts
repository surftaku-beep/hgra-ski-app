"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type GuardianFormState = {
  error?: string;
  success?: boolean;
};

function normalizeOptional(value: FormDataEntryValue | null) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

export async function createGuardian(
  _prevState: GuardianFormState,
  formData: FormData,
): Promise<GuardianFormState> {
  const name = normalizeOptional(formData.get("name"));
  if (!name) {
    return { error: "氏名を入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("guardians").insert({
    name,
    phone: normalizeOptional(formData.get("phone")),
    email: normalizeOptional(formData.get("email")),
    note: normalizeOptional(formData.get("note")),
  });

  if (error) {
    return { error: `登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/dashboard/guardians");
  return { success: true };
}

export async function updateGuardian(
  _prevState: GuardianFormState,
  formData: FormData,
): Promise<GuardianFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "更新対象が特定できませんでした。" };
  }

  const name = normalizeOptional(formData.get("name"));
  if (!name) {
    return { error: "氏名を入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("guardians")
    .update({
      name,
      phone: normalizeOptional(formData.get("phone")),
      email: normalizeOptional(formData.get("email")),
      note: normalizeOptional(formData.get("note")),
    })
    .eq("id", id);

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/dashboard/guardians");
  return { success: true };
}

export async function deleteGuardian(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("guardians").delete().eq("id", id);

  if (error) {
    return { error: `削除に失敗しました: ${error.message}` };
  }

  revalidatePath("/dashboard/guardians");
  return {};
}
