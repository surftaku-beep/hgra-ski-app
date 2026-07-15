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
import { NewsFormDialog } from "@/components/news-form-dialog";
import { DeleteNewsButton } from "@/components/delete-news-button";
import { createClient } from "@/utils/supabase/server";
import { getIsCoachOrAdmin } from "@/utils/supabase/role";
import type { News } from "@/app/types";

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function NewsAdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isCoachOrAdmin = await getIsCoachOrAdmin(supabase, user?.id);

  const { data: newsList, error } = await supabase
    .from("news")
    .select(
      "id, title, slug, body, cover_image_url, is_published, published_at, created_at",
    )
    .order("created_at", { ascending: false })
    .returns<News[]>();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          ニュース管理
        </h1>
        <p className="text-muted-foreground text-sm">
          公開サイトの「ニュース」に表示される記事を管理します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>記事一覧</CardTitle>
          <CardDescription>
            {newsList
              ? `${newsList.length}件登録されています(下書き含む)。`
              : "データを取得できませんでした。"}
          </CardDescription>
          {isCoachOrAdmin ? (
            <CardAction>
              <NewsFormDialog
                mode="create"
                trigger={<Button size="sm">記事を作成</Button>}
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
          ) : !newsList || newsList.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              まだ記事がありません。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>タイトル</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>公開日</TableHead>
                  {isCoachOrAdmin ? (
                    <TableHead className="text-right">操作</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {newsList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.title}
                    </TableCell>
                    <TableCell>
                      {item.is_published ? (
                        <Badge variant="secondary">公開中</Badge>
                      ) : (
                        <Badge variant="outline">下書き</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(item.published_at)}</TableCell>
                    {isCoachOrAdmin ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <NewsFormDialog
                            mode="edit"
                            news={item}
                            trigger={
                              <Button variant="ghost" size="sm">
                                編集
                              </Button>
                            }
                          />
                          <DeleteNewsButton id={item.id} title={item.title} />
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
