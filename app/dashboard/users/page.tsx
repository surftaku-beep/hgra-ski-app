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
  const isCoachOrAdmin = role === "admin" || role === "coach";

  const [{ data: users }, { data: unlinkedAthletes }] = await Promise.all([
    supabase.rpc("get_coach_directory"),
    supabase
      .from("athletes")
      .select("id, name")
      .is("user_id", null)
      .order("name")
      .returns<Pick<Athlete, "id" | "name">[]>(),
  ]);

  const userList = (users ?? []) as CoachDirectoryEntry[];
  const athleteOptions = (unlinkedAthletes ?? []).map((athlete) => ({
    value: athlete.id,
    label: athlete.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          ユーザー管理
        </h1>
        <p className="text-muted-foreground text-sm">
          コーチ・管理者・選手・保護者アカウントの招待と一覧です。
        </p>
      </div>

      {isCoachOrAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>新規ユーザーを招待</CardTitle>
            <CardDescription>
              招待メールが送信され、本人がパスワードを設定してログインできるようになります。
              {role !== "admin"
                ? " 管理者(admin)ロールの付与はadminのみ行えます。"
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteUserForm
              canGrantAdmin={role === "admin"}
              athleteOptions={athleteOptions}
            />
          </CardContent>
        </Card>
      ) : null}

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
