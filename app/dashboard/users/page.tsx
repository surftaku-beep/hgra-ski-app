import {
  Card,
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
import { InviteUserForm } from "@/components/invite-user-form";
import { DeleteUserButton } from "@/components/delete-user-button";
import { createClient } from "@/utils/supabase/server";
import { getUserRole } from "@/utils/supabase/role";
import type { Athlete, CoachDirectoryEntry } from "@/app/dashboard/types";

const ROLE_LABELS: Record<string, string> = {
  admin: "管理者",
  coach: "コーチ",
  athlete: "選手",
  guardian: "保護者",
};

export default async function UsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getUserRole(supabase, user?.id);
  const isAdmin = role === "admin";

  const [
    { data: users },
    { data: unlinkedAthletes, error: unlinkedAthletesError },
  ] = await Promise.all([
    supabase.rpc("get_coach_directory"),
    supabase
      .from("athletes")
      .select("id, name")
      .is("user_id", null)
      .order("name")
      .returns<Pick<Athlete, "id" | "name">[]>(),
  ]);

  if (unlinkedAthletesError) {
    console.error(
      "[UsersPage] failed to load unlinked athletes:",
      unlinkedAthletesError,
    );
  }

  const userList = (users ?? []) as CoachDirectoryEntry[];
  const athleteOptions = (unlinkedAthletes ?? []).map((athlete) => ({
    value: athlete.id,
    label: athlete.name,
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          ユーザー管理
        </h1>
        <p className="text-muted-foreground text-sm">
          コーチ・管理者・選手・保護者アカウントの招待と一覧です。
        </p>
      </div>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>新規ユーザーを招待</CardTitle>
            <CardDescription>
              招待メールが送信され、本人がパスワードを設定してログインできるようになります。ユーザーの招待はadminのみ行えます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {unlinkedAthletesError ? (
              <p className="text-destructive text-sm">
                選手一覧の取得に失敗しました({unlinkedAthletesError.message}
                )。データベースのスキーマが最新か確認してください。
              </p>
            ) : (
              <InviteUserForm canGrantAdmin athleteOptions={athleteOptions} />
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground text-sm">
          新規ユーザーの招待はadminのみ行えます。
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>登録済みユーザー</CardTitle>
          <CardDescription>{userList.length}名が登録されています。</CardDescription>
        </CardHeader>
        <CardContent>
          {userList.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              ユーザーが見つかりませんでした。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead>役割</TableHead>
                  {isAdmin ? (
                    <TableHead className="text-right">操作</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {userList.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.email ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ROLE_LABELS[entry.role] ?? entry.role}
                      </Badge>
                    </TableCell>
                    {isAdmin ? (
                      <TableCell className="text-right">
                        {entry.id !== user?.id ? (
                          <DeleteUserButton
                            id={entry.id}
                            email={entry.email ?? entry.id}
                          />
                        ) : null}
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
