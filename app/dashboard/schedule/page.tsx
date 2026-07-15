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
import { ScheduleFormDialog } from "@/components/schedule-form-dialog";
import { DeleteScheduleButton } from "@/components/delete-schedule-button";
import { createClient } from "@/utils/supabase/server";
import { getIsCoachOrAdmin } from "@/utils/supabase/role";
import type { CoachDirectoryEntry } from "@/app/dashboard/types";
import type { PersonalScheduleEntry } from "@/app/types";

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SchedulePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isCoachOrAdmin = await getIsCoachOrAdmin(supabase, user?.id);

  const [{ data: entries, error }, { data: coaches }] = await Promise.all([
    supabase
      .from("personal_schedule")
      .select(
        "id, coach_id, title, description, start_at, end_at, related_tournament_id",
      )
      .order("start_at", { ascending: true })
      .returns<PersonalScheduleEntry[]>(),
    supabase.rpc("get_coach_directory"),
  ]);

  const coachDirectory = (coaches ?? []) as CoachDirectoryEntry[];
  const coachEmailById = new Map(
    coachDirectory.map((coach) => [coach.id, coach.email ?? coach.id]),
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          スケジュール
        </h1>
        <p className="text-muted-foreground text-sm">
          コーチ陣の個人スケジュールです。閲覧は全員可能、編集・削除は本人の予定のみ行えます。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>予定一覧</CardTitle>
          <CardDescription>
            {entries
              ? `${entries.length}件の予定が登録されています。`
              : "データを取得できませんでした。"}
          </CardDescription>
          {isCoachOrAdmin ? (
            <CardAction>
              <ScheduleFormDialog
                mode="create"
                trigger={<Button size="sm">予定を登録</Button>}
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
          ) : !entries || entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              まだ予定が登録されていません。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>タイトル</TableHead>
                  <TableHead>開始</TableHead>
                  <TableHead>終了</TableHead>
                  <TableHead>担当</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const isOwn = entry.coach_id === user?.id;
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.title}
                      </TableCell>
                      <TableCell>{formatDateTime(entry.start_at)}</TableCell>
                      <TableCell>{formatDateTime(entry.end_at)}</TableCell>
                      <TableCell>
                        {coachEmailById.get(entry.coach_id) ?? entry.coach_id}
                      </TableCell>
                      <TableCell className="text-right">
                        {isOwn ? (
                          <div className="flex justify-end gap-1">
                            <ScheduleFormDialog
                              mode="edit"
                              entry={entry}
                              trigger={
                                <Button variant="ghost" size="sm">
                                  編集
                                </Button>
                              }
                            />
                            <DeleteScheduleButton
                              id={entry.id}
                              title={entry.title}
                            />
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
