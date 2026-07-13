import type { SupabaseClient } from "@supabase/supabase-js";

export async function getUserRole(
  supabase: SupabaseClient,
  userId: string | undefined,
): Promise<string | null> {
  if (!userId) {
    return null;
  }

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return data?.role ?? null;
}

export async function getIsCoachOrAdmin(
  supabase: SupabaseClient,
  userId: string | undefined,
) {
  const role = await getUserRole(supabase, userId);
  return role === "admin" || role === "coach";
}
