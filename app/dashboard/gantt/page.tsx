import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GanttChart } from "@/components/gantt-chart";
import { TournamentDetailPanel } from "@/components/tournament-detail-panel";
import { createClient } from "@/utils/supabase/server";
import type { Tournament } from "@/app/dashboard/types";

export default async function GanttPage({
  searchParams,
}: {
  searchParams: Promise<{ tournament?: string }>;
}) {
  const { tournament: selectedId } = await searchParams;
  const supabase = await createClient();

  const { data: tournaments, error } = await supabase
    .from("tournaments")
    .select("id, name, start_date, end_date")
    .order("start_date", { ascending: true })
    .returns<Pick<Tournament, "id" | "name" | "start_date" | "end_date">[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          ガントチャート
        </h1>
        <p className="text-muted-foreground text-sm">
          大会の開催期間を一覧できます。バーをクリックすると詳細が下に表示されます。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>大会スケジュール</CardTitle>
          <CardDescription>
            {tournaments
              ? `${tournaments.length}件の大会を表示しています。`
              : "データを取得できませんでした。"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-destructive text-sm">
              データの取得に失敗しました。
              <br />
              <span className="text-muted-foreground">
                詳細: {error.message}
              </span>
            </p>
          ) : (
            <GanttChart tournaments={tournaments ?? []} />
          )}
        </CardContent>
      </Card>

      {selectedId ? (
        <div className="space-y-4">
          <Link
            href={`/dashboard/tournaments/${selectedId}`}
            className="text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            大会詳細ページを開く →
          </Link>
          <TournamentDetailPanel tournamentId={selectedId} />
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          バーをクリックすると、ここに大会の詳細が表示されます。
        </p>
      )}
    </div>
  );
}
