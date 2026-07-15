import { createClient } from "@/utils/supabase/server";
import { TEAM_PROFILE_ID, type TeamProfile } from "@/app/types";

export default async function TeamPage() {
  const supabase = await createClient();

  const { data: teamProfile } = await supabase
    .from("team_profile")
    .select("id, mission_statement, history, coaching_philosophy, updated_at")
    .eq("id", TEAM_PROFILE_ID)
    .maybeSingle<TeamProfile>();

  const hasContent =
    teamProfile?.mission_statement ||
    teamProfile?.history ||
    teamProfile?.coaching_philosophy;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          チーム紹介
        </h1>
        <p className="text-muted-foreground text-sm">
          私たちのチームについてご紹介します。
        </p>
      </div>

      {!hasContent ? (
        <p className="text-muted-foreground text-sm">
          チーム紹介の内容はまだ準備中です。
        </p>
      ) : (
        <div className="space-y-8">
          {teamProfile?.mission_statement ? (
            <section>
              <h2 className="text-lg font-semibold tracking-tight">
                ミッション
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {teamProfile.mission_statement}
              </p>
            </section>
          ) : null}

          {teamProfile?.history ? (
            <section>
              <h2 className="text-lg font-semibold tracking-tight">沿革</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {teamProfile.history}
              </p>
            </section>
          ) : null}

          {teamProfile?.coaching_philosophy ? (
            <section>
              <h2 className="text-lg font-semibold tracking-tight">
                指導方針
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {teamProfile.coaching_philosophy}
              </p>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
