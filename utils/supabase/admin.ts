import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * service_role key を使う管理者用クライアント。
 * RLSを完全にバイパスするため、呼び出し元で必ず
 * (1) 呼び出し者がadmin/coachであることを検証し、
 * (2) このクライアントをサーバー専用コード(Server Action等)以外で
 *     importしないこと。
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEYが設定されていません。.env.localに追加してください(Supabaseダッシュボード > Project Settings > API > service_role key)。",
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
