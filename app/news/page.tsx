import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import type { News } from "@/app/types";

function formatDate(date: string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function NewsListPage() {
  const supabase = await createClient();

  const { data: newsList, error } = await supabase
    .from("news")
    .select(
      "id, title, slug, body, cover_image_url, is_published, published_at, created_at",
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .returns<News[]>();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">ニュース</h1>
        <p className="text-muted-foreground text-sm">
          チームからのお知らせ一覧です。
        </p>
      </div>

      {error ? (
        <p className="text-destructive text-sm">
          ニュースの取得に失敗しました。
        </p>
      ) : !newsList || newsList.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          まだお知らせはありません。
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {newsList.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardDescription>
                  {formatDate(item.published_at)}
                </CardDescription>
                <CardTitle className="text-base">
                  <Link
                    href={`/news/${item.slug}`}
                    className="hover:underline"
                  >
                    {item.title}
                  </Link>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
