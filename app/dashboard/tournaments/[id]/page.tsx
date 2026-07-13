import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TournamentFormDialog } from "@/components/tournament-form-dialog";
import { DeleteTournamentButton } from "@/components/delete-tournament-button";
import { TournamentDetailPanel } from "@/components/tournament-detail-panel";
import { createClient } from "@/utils/supabase/server";
import { getIsCoachOrAdmin } from "@/utils/supabase/role";
import type { Tournament } from "@/app/dashboard/types";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isCoachOrAdmin = await getIsCoachOrAdmin(supabase, user?.id);

  const { data: tournament } = await supabase
    .from("tournaments")
    .select(
      "id, name, start_date, end_date, location, description, grade, age_category",
    )
    .eq("id", id)
    .maybeSingle<Tournament>();

  if (!tournament) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/tournaments"
          className="text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          ← 大会一覧に戻る
        </Link>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            {tournament.name}
          </h1>
          {isCoachOrAdmin ? (
            <div className="flex shrink-0 gap-1">
              <TournamentFormDialog
                mode="edit"
                tournament={tournament}
                trigger={
                  <Button variant="outline" size="sm">
                    大会情報を編集
                  </Button>
                }
              />
              <DeleteTournamentButton
                id={tournament.id}
                name={tournament.name}
                redirectTo="/dashboard/tournaments"
              />
            </div>
          ) : null}
        </div>
      </div>

      <TournamentDetailPanel tournamentId={tournament.id} />
    </div>
  );
}
