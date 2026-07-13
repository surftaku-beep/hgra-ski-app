import Link from "next/link";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TournamentFormDialog } from "@/components/tournament-form-dialog";
import { DeleteTournamentButton } from "@/components/delete-tournament-button";
import { createClient } from "@/utils/supabase/server";
import { getIsCoachOrAdmin } from "@/utils/supabase/role";
import type { Tournament } from "@/app/dashboard/types";

function formatDate(date: string | null) {
  return date ? date.replaceAll("-", "/") : "-";
}

export default async function TournamentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isCoachOrAdmin = await getIsCoachOrAdmin(supabase, user?.id);

  const { data: tournaments, error } = await supabase
    .from("tournaments")
    .select("id, name, start_date, end_date, location")
    .order("start_date", { ascending: false })
    .returns<Tournament[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">大会・遠征</h1>
        <p className="text-muted-foreground text-sm">
          登録されている大会・遠征の一覧です。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>一覧</CardTitle>
          <CardDescription>
            {tournaments
              ? `${tournaments.length}件登録されています。`
              : "データを取得できませんでした。"}
          </CardDescription>
          {isCoachOrAdmin ? (
            <CardAction>
              <TournamentFormDialog
                mode="create"
                trigger={<Button size="sm">大会を登録</Button>}
              />
            </CardAction>
          ) : null}
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
          ) : !tournaments || tournaments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              まだ大会が登録されていません。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>大会名</TableHead>
                  <TableHead>開始日</TableHead>
                  <TableHead>終了日</TableHead>
                  <TableHead>開催地</TableHead>
                  {isCoachOrAdmin ? (
                    <TableHead className="text-right">操作</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournaments.map((tournament) => (
                  <TableRow key={tournament.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/tournaments/${tournament.id}`}
                        className="hover:underline"
                      >
                        {tournament.name}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(tournament.start_date)}</TableCell>
                    <TableCell>{formatDate(tournament.end_date)}</TableCell>
                    <TableCell>{tournament.location ?? "-"}</TableCell>
                    {isCoachOrAdmin ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <TournamentFormDialog
                            mode="edit"
                            tournament={tournament}
                            trigger={
                              <Button variant="ghost" size="sm">
                                編集
                              </Button>
                            }
                          />
                          <DeleteTournamentButton
                            id={tournament.id}
                            name={tournament.name}
                          />
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
