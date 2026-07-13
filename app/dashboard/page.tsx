import Image from "next/image";
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
import { AthleteFormDialog } from "@/components/athlete-form-dialog";
import { DeleteAthleteButton } from "@/components/delete-athlete-button";
import { createClient } from "@/utils/supabase/server";
import { getIsCoachOrAdmin } from "@/utils/supabase/role";
import type { Athlete } from "@/app/dashboard/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isCoachOrAdmin = await getIsCoachOrAdmin(supabase, user?.id);

  const { data: athletes, error } = await supabase
    .from("athletes")
    .select("id, name, category, grade, affiliation, saj_id, birth_year")
    .order("name")
    .returns<Athlete[]>();

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Image
          src="/HGRA_BLACK.png"
          alt="HGRA スキーチーム ロゴ"
          width={120}
          height={152}
          priority
          className="h-20 w-auto"
        />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          ダッシュボード
        </h1>
        <p className="text-muted-foreground text-sm">
          登録されている選手の一覧です。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>選手一覧</CardTitle>
          <CardDescription>
            {athletes
              ? `${athletes.length}名の選手が登録されています。`
              : "選手データを取得できませんでした。"}
          </CardDescription>
          {isCoachOrAdmin ? (
            <CardAction>
              <AthleteFormDialog
                mode="create"
                trigger={<Button size="sm">選手を登録</Button>}
              />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-destructive text-sm">
              選手データの取得に失敗しました。Supabaseの接続設定
              (.env.local) とRLSポリシーを確認してください。
              <br />
              <span className="text-muted-foreground">
                詳細: {error.message}
              </span>
            </p>
          ) : !athletes || athletes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              まだ選手が登録されていません。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>氏名</TableHead>
                  <TableHead>クラス</TableHead>
                  <TableHead>学年</TableHead>
                  <TableHead>所属</TableHead>
                  <TableHead>SAJ ID</TableHead>
                  {isCoachOrAdmin ? (
                    <TableHead className="text-right">操作</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {athletes.map((athlete) => (
                  <TableRow key={athlete.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/athletes/${athlete.id}`}
                        className="hover:underline"
                      >
                        {athlete.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {athlete.category ? (
                        <Badge variant="secondary">{athlete.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">未設定</span>
                      )}
                    </TableCell>
                    <TableCell>{athlete.grade ?? "-"}</TableCell>
                    <TableCell>{athlete.affiliation ?? "-"}</TableCell>
                    <TableCell>{athlete.saj_id ?? "-"}</TableCell>
                    {isCoachOrAdmin ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <AthleteFormDialog
                            mode="edit"
                            athlete={athlete}
                            trigger={
                              <Button variant="ghost" size="sm">
                                編集
                              </Button>
                            }
                          />
                          <DeleteAthleteButton
                            id={athlete.id}
                            name={athlete.name}
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
