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
import { GuardianFormDialog } from "@/components/guardian-form-dialog";
import { DeleteGuardianButton } from "@/components/delete-guardian-button";
import { createClient } from "@/utils/supabase/server";
import { getIsCoachOrAdmin } from "@/utils/supabase/role";
import type { Guardian } from "@/app/dashboard/types";

export default async function GuardiansPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isCoachOrAdmin = await getIsCoachOrAdmin(supabase, user?.id);

  const { data: guardians, error } = await supabase
    .from("guardians")
    .select("id, name, phone, email, note")
    .order("name")
    .returns<Guardian[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          保護者・関係者
        </h1>
        <p className="text-muted-foreground text-sm">
          大会の引率者として登録できる連絡先の一覧です。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>一覧</CardTitle>
          <CardDescription>
            {guardians
              ? `${guardians.length}名が登録されています。`
              : "データを取得できませんでした。"}
          </CardDescription>
          {isCoachOrAdmin ? (
            <CardAction>
              <GuardianFormDialog
                mode="create"
                trigger={<Button size="sm">登録する</Button>}
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
          ) : !guardians || guardians.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              まだ登録されていません。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>氏名</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead>メモ</TableHead>
                  {isCoachOrAdmin ? (
                    <TableHead className="text-right">操作</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {guardians.map((guardian) => (
                  <TableRow key={guardian.id}>
                    <TableCell className="font-medium">
                      {guardian.name}
                    </TableCell>
                    <TableCell>{guardian.phone ?? "-"}</TableCell>
                    <TableCell>{guardian.email ?? "-"}</TableCell>
                    <TableCell>{guardian.note ?? "-"}</TableCell>
                    {isCoachOrAdmin ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <GuardianFormDialog
                            mode="edit"
                            guardian={guardian}
                            trigger={
                              <Button variant="ghost" size="sm">
                                編集
                              </Button>
                            }
                          />
                          <DeleteGuardianButton
                            id={guardian.id}
                            name={guardian.name}
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
