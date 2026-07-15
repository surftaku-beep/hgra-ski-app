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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EntityPickerDialog } from "@/components/entity-picker-dialog";
import { RemoveTournamentEntryButton } from "@/components/remove-tournament-entry-button";
import { createClient } from "@/utils/supabase/server";
import { getIsCoachOrAdmin } from "@/utils/supabase/role";
import type {
  Athlete,
  CoachDirectoryEntry,
  Guardian,
  Tournament,
  TournamentEntry,
} from "@/app/dashboard/types";

function formatDate(date: string | null) {
  return date ? date.replaceAll("-", "/") : "-";
}

/**
 * 大会基本情報・参加選手・引率者アサインの3カードをまとめて表示する。
 * 大会詳細ページ(/dashboard/tournaments/[id])と大会スケジュールページの
 * 両方から再利用される。
 */
export async function TournamentDetailPanel({
  tournamentId,
}: {
  tournamentId: string;
}) {
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
    .eq("id", tournamentId)
    .maybeSingle<Tournament>();

  if (!tournament) {
    return (
      <p className="text-muted-foreground text-sm">
        大会情報が見つかりませんでした。
      </p>
    );
  }

  const [
    { data: entries, error: entriesError },
    { data: athletes },
    { data: guardians },
    { data: coaches },
  ] = await Promise.all([
    supabase
      .from("tournament_entries")
      .select(
        "id, entry_type, athlete:athletes(id, name), guardian:guardians(id, name, phone, email), coach_id",
      )
      .eq("tournament_id", tournamentId)
      .returns<TournamentEntry[]>(),
    supabase
      .from("athletes")
      .select("id, name")
      .order("name")
      .returns<Pick<Athlete, "id" | "name">[]>(),
    supabase
      .from("guardians")
      .select("id, name, phone, email, note")
      .order("name")
      .returns<Guardian[]>(),
    supabase.rpc("get_coach_directory"),
  ]);

  const entryList = entries ?? [];
  const athleteEntries = entryList.filter(
    (entry) => entry.entry_type === "athlete",
  );
  const guardianChaperones = entryList.filter(
    (entry) => entry.entry_type === "guardian_chaperone",
  );
  const coachChaperones = entryList.filter(
    (entry) => entry.entry_type === "coach_chaperone",
  );

  const coachDirectory = (coaches ?? []) as CoachDirectoryEntry[];
  const coachEmailById = new Map(
    coachDirectory.map((coach) => [coach.id, coach.email ?? coach.id]),
  );

  const enteredAthleteIds = new Set(
    athleteEntries.map((entry) => entry.athlete?.id).filter(Boolean),
  );
  const enteredGuardianIds = new Set(
    guardianChaperones.map((entry) => entry.guardian?.id).filter(Boolean),
  );
  const enteredCoachIds = new Set(
    coachChaperones.map((entry) => entry.coach_id).filter(Boolean),
  );

  const athleteOptions = (athletes ?? [])
    .filter((athlete) => !enteredAthleteIds.has(athlete.id))
    .map((athlete) => ({ value: athlete.id, label: athlete.name }));

  const guardianOptions = (guardians ?? [])
    .filter((guardian) => !enteredGuardianIds.has(guardian.id))
    .map((guardian) => ({ value: guardian.id, label: guardian.name }));

  const coachOptions = coachDirectory
    .filter((coach) => !enteredCoachIds.has(coach.id))
    .map((coach) => ({
      value: coach.id,
      label: `${coach.email ?? coach.id}(${coach.role === "admin" ? "管理者" : "コーチ"})`,
    }));

  return (
    <div className="space-y-10">
      <Card>
        <CardHeader>
          <CardTitle>大会基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-xs">開催日</p>
              <p className="mt-0.5">
                {formatDate(tournament.start_date)}
                {tournament.end_date &&
                tournament.end_date !== tournament.start_date
                  ? ` 〜 ${formatDate(tournament.end_date)}`
                  : ""}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">開催地</p>
              <p className="mt-0.5">{tournament.location ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">グレード</p>
              <p className="mt-0.5">
                {tournament.grade ? (
                  <Badge variant="secondary">{tournament.grade}</Badge>
                ) : (
                  "-"
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">対象カテゴリ</p>
              <p className="mt-0.5">
                {tournament.age_category ? (
                  <Badge variant="secondary">{tournament.age_category}</Badge>
                ) : (
                  "-"
                )}
              </p>
            </div>
          </div>
          {tournament.description ? (
            <div>
              <p className="text-muted-foreground text-xs">概要・メモ</p>
              <p className="mt-0.5 text-sm whitespace-pre-wrap">
                {tournament.description}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {entriesError ? (
        <p className="text-destructive text-sm">
          エントリー情報の取得に失敗しました。
          <br />
          <span className="text-muted-foreground">
            詳細: {entriesError.message}
          </span>
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>参加選手</CardTitle>
          <CardDescription>
            {athleteEntries.length}名がエントリーしています。
          </CardDescription>
          {isCoachOrAdmin ? (
            <CardAction>
              <EntityPickerDialog
                tournamentId={tournament.id}
                entryType="athlete"
                title="参加選手を追加"
                fieldLabel="選手"
                options={athleteOptions}
                trigger={<Button size="sm">選手を追加</Button>}
              />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {athleteEntries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              まだ参加選手が登録されていません。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>氏名</TableHead>
                  {isCoachOrAdmin ? (
                    <TableHead className="text-right">操作</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {athleteEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.athlete ? (
                        <Link
                          href={`/dashboard/athletes/${entry.athlete.id}`}
                          className="hover:underline"
                        >
                          {entry.athlete.name}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    {isCoachOrAdmin ? (
                      <TableCell className="text-right">
                        <RemoveTournamentEntryButton
                          entryId={entry.id}
                          tournamentId={tournament.id}
                          label={entry.athlete?.name ?? "選手"}
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>引率者アサイン</CardTitle>
          <CardDescription>
            保護者{guardianChaperones.length}名・コーチ
            {coachChaperones.length}名が引率者として登録されています。
          </CardDescription>
          {isCoachOrAdmin ? (
            <CardAction>
              <div className="flex gap-2">
                <EntityPickerDialog
                  tournamentId={tournament.id}
                  entryType="guardian_chaperone"
                  title="引率保護者を追加"
                  fieldLabel="保護者"
                  options={guardianOptions}
                  trigger={
                    <Button variant="outline" size="sm">
                      保護者を追加
                    </Button>
                  }
                />
                <EntityPickerDialog
                  tournamentId={tournament.id}
                  entryType="coach_chaperone"
                  title="引率コーチを追加"
                  fieldLabel="コーチ"
                  options={coachOptions}
                  trigger={<Button size="sm">コーチを追加</Button>}
                />
              </div>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {guardianChaperones.length === 0 && coachChaperones.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              まだ引率者が登録されていません。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>氏名 / 連絡先</TableHead>
                  <TableHead>区分</TableHead>
                  {isCoachOrAdmin ? (
                    <TableHead className="text-right">操作</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {guardianChaperones.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.guardian?.name ?? "-"}
                      {entry.guardian?.phone || entry.guardian?.email ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {[entry.guardian?.phone, entry.guardian?.email]
                            .filter(Boolean)
                            .join(" / ")}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">保護者</Badge>
                    </TableCell>
                    {isCoachOrAdmin ? (
                      <TableCell className="text-right">
                        <RemoveTournamentEntryButton
                          entryId={entry.id}
                          tournamentId={tournament.id}
                          label={entry.guardian?.name ?? "保護者"}
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
                {coachChaperones.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.coach_id
                        ? (coachEmailById.get(entry.coach_id) ??
                          entry.coach_id)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">コーチ</Badge>
                    </TableCell>
                    {isCoachOrAdmin ? (
                      <TableCell className="text-right">
                        <RemoveTournamentEntryButton
                          entryId={entry.id}
                          tournamentId={tournament.id}
                          label={
                            entry.coach_id
                              ? (coachEmailById.get(entry.coach_id) ??
                                "コーチ")
                              : "コーチ"
                          }
                        />
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
