"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getUserRole } from "@/utils/supabase/role";

export type ScheduleFormState = {
  error?: string;
  success?: boolean;
};

const FORBIDDEN: ScheduleFormState = {
  error: "403 Forbidden: この操作を行う権限がありません。",
};

function normalizeOptional(value: FormDataEntryValue | null) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function parseScheduleFormData(formData: FormData) {
  return {
    title: normalizeOptional(formData.get("title")),
    description: normalizeOptional(formData.get("description")),
    start_at: normalizeOptional(formData.get("start_at")),
    end_at: normalizeOptional(formData.get("end_at")),
  };
}

export async function createScheduleEntry(
  _prevState: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const values = parseScheduleFormData(formData);

  if (!values.title || !values.start_at) {
    return { error: "タイトル・開始日時は必須です。" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログイン状態を確認できませんでした。" };
  }

  // RLSだけに頼らず、DB操作の前に明示的にロールを確認する。
  // athlete/guardianはスケジュールの作成を一切行えない。
  const callerRole = await getUserRole(supabase, user.id);
  if (callerRole !== "admin" && callerRole !== "coach") {
    return FORBIDDEN;
  }

  const { error } = await supabase.from("personal_schedule").insert({
    ...values,
    coach_id: user.id,
  });

  if (error) {
    console.error("[createScheduleEntry] failed:", error);
    return { error: `登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateScheduleEntry(
  _prevState: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "更新対象が特定できませんでした。" };
  }

  const values = parseScheduleFormData(formData);

  if (!values.title || !values.start_at) {
    return { error: "タイトル・開始日時は必須です。" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログイン状態を確認できませんでした。" };
  }

  const callerRole = await getUserRole(supabase, user.id);
  if (callerRole !== "admin" && callerRole !== "coach") {
    return FORBIDDEN;
  }

  // 所有者チェック: RLSでも防がれるが、意図が明確なエラーを返すため
  // アプリ側でも「自分の予定か」を確認してから更新する。
  const { data: existing } = await supabase
    .from("personal_schedule")
    .select("coach_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.coach_id !== user.id) {
    return {
      error: "403 Forbidden: 自分以外の予定は編集できません。",
    };
  }

  const { error } = await supabase
    .from("personal_schedule")
    .update(values)
    .eq("id", id);

  if (error) {
    console.error("[updateScheduleEntry] failed:", error);
    return { error: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteScheduleEntry(
  id: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログイン状態を確認できませんでした。" };
  }

  const callerRole = await getUserRole(supabase, user.id);
  if (callerRole !== "admin" && callerRole !== "coach") {
    return { error: "403 Forbidden: この操作を行う権限がありません。" };
  }

  const { data: existing } = await supabase
    .from("personal_schedule")
    .select("coach_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.coach_id !== user.id) {
    return {
      error: "403 Forbidden: 自分以外の予定は削除できません。",
    };
  }

  const { error } = await supabase
    .from("personal_schedule")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[deleteScheduleEntry] failed:", error);
    return { error: `削除に失敗しました: ${error.message}` };
  }

  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard");
  return {};
}
