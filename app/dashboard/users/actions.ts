"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getUserRole } from "@/utils/supabase/role";

export type InviteUserFormState = {
  error?: string;
  success?: boolean;
};

const ALLOWED_ROLES = ["admin", "coach", "athlete", "guardian"] as const;

export async function inviteUser(
  _prevState: InviteUserFormState,
  formData: FormData,
): Promise<InviteUserFormState> {
  const email = (formData.get("email") as string | null)?.trim();
  const role = formData.get("role") as string | null;
  const athleteId =
    (formData.get("athlete_id") as string | null)?.trim() || null;

  if (!email) {
    return { error: "メールアドレスを入力してください。" };
  }
  if (!role || !ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    return { error: "役割を選択してください。" };
  }
  if (role === "athlete" && !athleteId) {
    return { error: "対象の選手を選択してください。" };
  }

  // service_role clientはRLSを完全にバイパスするため、
  // 呼び出し元のロールをここで必ず自前チェックする。
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const callerRole = await getUserRole(supabase, user?.id);

  if (callerRole !== "admin" && callerRole !== "coach") {
    return { error: "この操作を行う権限がありません。" };
  }
  if (role === "admin" && callerRole !== "admin") {
    return { error: "管理者(admin)ロールの付与はadminのみ行えます。" };
  }

  // 選手ロールの場合、対象の選手が既に別アカウントと紐付いていないか確認する
  if (role === "athlete" && athleteId) {
    const { data: athlete, error: athleteError } = await supabase
      .from("athletes")
      .select("id, user_id")
      .eq("id", athleteId)
      .maybeSingle();

    if (athleteError || !athlete) {
      return { error: "選択された選手が見つかりませんでした。" };
    }
    if (athlete.user_id) {
      return { error: "この選手は既に別のアカウントと紐付けられています。" };
    }
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (e) {
    const message = e instanceof Error ? e.message : "不明なエラーです。";
    console.error("[inviteUser] admin client init failed:", message);
    return { error: message };
  }

  const { data: invited, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email);

  if (inviteError || !invited?.user) {
    console.error("[inviteUser] inviteUserByEmail failed:", inviteError);
    return {
      error: `招待メールの送信に失敗しました: ${inviteError?.message ?? "不明なエラー"}`,
    };
  }

  const { error: profileError } = await supabase.from("users").insert({
    id: invited.user.id,
    role,
    email,
  });

  if (profileError) {
    console.error("[inviteUser] profile insert failed:", profileError);
    return {
      error: `認証ユーザーは作成されましたが、プロフィール登録に失敗しました: ${profileError.message}。Supabaseダッシュボードで手動確認してください。`,
    };
  }

  if (role === "athlete" && athleteId) {
    const { error: linkError } = await supabase
      .from("athletes")
      .update({ user_id: invited.user.id })
      .eq("id", athleteId);

    if (linkError) {
      console.error("[inviteUser] athlete link failed:", linkError);
      return {
        error: `ユーザーは作成されましたが、選手との紐付けに失敗しました: ${linkError.message}。Supabaseダッシュボードで手動確認してください。`,
      };
    }
  }

  revalidatePath("/dashboard/users");
  return { success: true };
}
