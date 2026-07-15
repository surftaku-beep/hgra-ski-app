import Link from "next/link";
import { notFound } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RaceResultFormDialog } from "@/components/race-result-form-dialog";
import { DeleteRaceResultButton } from "@/components/delete-race-result-button";
import { EvaluationForm } from "@/components/evaluation-form";
import { createClient } from "@/utils/supabase/server";
import { getIsCoachOrAdmin } from "@/utils/supabase/role";
import type { Athlete, Evaluation, RaceResult } from "@/app/dashboard/types";

function formatDate(date: string | null) {
  return date ? date.replaceAll("-", "/") : "-";
}

export default async function AthleteDetailPage({
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

  const { data: athlete } = await supabase
    .from("athletes")
    .select("id, name, category, grade, affiliation, saj_id, birth_year")
    .eq("id", id)
    .maybeSingle<Athlete>();

  if (!athlete) {
    notFound();
  }

  const { data: raceResults, error: resultsError } = await supabase
    .from("race_results")
    .select(
      "id, tournament_date, tournament_name, discipline, rank, time, saj_points",
    )
    .eq("athlete_id", id)
    .order("tournament_date", { ascending: false })
    .returns<RaceResult[]>();

  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("id, current_status, future_direction, updated_at")
    .eq("athlete_id", id)
    .maybeSingle<Evaluation>();

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/dashboard/athletes"
          className="text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          ← 選手一覧に戻る
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {athlete.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {athlete.category ? (
            <Badge variant="secondary">{athlete.category}</Badge>
          ) : null}
          {athlete.grade ? <span>{athlete.grade}</span> : null}
          {athlete.affiliation ? <span>{athlete.affiliation}</span> : null}
          {athlete.saj_id ? <span>SAJ ID: {athlete.saj_id}</span> : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>大会成績</CardTitle>
          <CardDescription>
            {raceResults
              ? `${raceResults.length}件の成績が登録されています。`
              : "成績データを取得できませんでした。"}
          </CardDescription>
          {isCoachOrAdmin ? (
            <CardAction>
              <RaceResultFormDialog
                mode="create"
                athleteId={athlete.id}
                trigger={<Button size="sm">成績を登録</Button>}
              />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {resultsError ? (
            <p className="text-destructive text-sm">
              成績データの取得に失敗しました。
              <br />
              <span className="text-muted-foreground">
                詳細: {resultsError.message}
              </span>
            </p>
          ) : !raceResults || raceResults.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              まだ成績が登録されていません。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>大会名</TableHead>
                  <TableHead>種目</TableHead>
                  <TableHead>順位</TableHead>
                  <TableHead>タイム</TableHead>
                  <TableHead>SAJポイント</TableHead>
                  {isCoachOrAdmin ? (
                    <TableHead className="text-right">操作</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {raceResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>{formatDate(result.tournament_date)}</TableCell>
                    <TableCell className="font-medium">
                      {result.tournament_name ?? "-"}
                    </TableCell>
                    <TableCell>
                      {result.discipline ? (
                        <Badge variant="secondary">{result.discipline}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{result.rank ?? "-"}</TableCell>
                    <TableCell>{result.time ?? "-"}</TableCell>
                    <TableCell>{result.saj_points ?? "-"}</TableCell>
                    {isCoachOrAdmin ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <RaceResultFormDialog
                            mode="edit"
                            athleteId={athlete.id}
                            raceResult={result}
                            trigger={
                              <Button variant="ghost" size="sm">
                                編集
                              </Button>
                            }
                          />
                          <DeleteRaceResultButton
                            id={result.id}
                            athleteId={athlete.id}
                            label={`${formatDate(result.tournament_date)} ${result.tournament_name ?? ""}`}
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

      {isCoachOrAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>育成・進学メモ</CardTitle>
            <CardDescription>
              コーチ間で共有される非公開の記録です。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EvaluationForm
              athleteId={athlete.id}
              currentStatus={evaluation?.current_status ?? null}
              futureDirection={evaluation?.future_direction ?? null}
              updatedAt={evaluation?.updated_at ?? null}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
